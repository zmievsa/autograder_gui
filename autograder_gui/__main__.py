import os
from tkinter.constants import CURRENT
from typing import Dict, List, Optional, Tuple, TypeVar, Union
from typing_extensions import Literal
import eel
from pathlib import Path
import sys

import tkinter as tk
from tkinter.filedialog import askopenfilename, asksaveasfilename

from autograder.config_manager import DEFAULT_ARGLIST_VALUE_KEY, ArgList, GradingConfig
from autograder.autograder import AutograderPaths
from zipfile import ZipFile
from tempfile import TemporaryDirectory
from itertools import chain

from tomlkit.api import array, document, dumps, inline_table, parse, table
from tomlkit.items import Array, Bool, InlineTable, Item, Table, item
from tomlkit.toml_document import TOMLDocument

import shutil


TEMPDIR: Optional[TemporaryDirectory] = None
CURRENT_ASSIGNMENT: Optional[dict] = None

SIZE = (1200, 900)


def run():
    os.chdir(str(Path(__file__).parent))
    eel.init("static", allowed_extensions=[".html"])
    eel.start(
        "templates/index.html",
        jinja_templates="templates",
        size=SIZE,
        block=True,
    )


@eel.expose
def autograder_run(config: dict, homeworks_dir: Path, selected_homeworks: List[str]):
    print("RUN", config, homeworks_dir, selected_homeworks)


@eel.expose
def autograder_plagiarism(homeworks_dir: Path, selected_homeworks: List[str]):
    pass


@eel.expose
def save_assignment(assignment: dict):
    global CURRENT_ASSIGNMENT
    CURRENT_ASSIGNMENT = assignment


@eel.expose
def get_assignment():
    return CURRENT_ASSIGNMENT


@eel.expose
def extract_zip(filetype: str):
    global CURRENT_ASSIGNMENT
    root = tk.Tk()
    root.withdraw()
    root.wm_attributes("-topmost", 1)
    f = askopenfilename()
    if not f:
        return
    path = Path(f)
    if not path.exists() or not (path.is_dir() or path.is_file()):
        return

    # In case somehow user tried to upload homeworks before uploading assignment
    if filetype == "assignment" or (filetype == "homeworks" and CURRENT_ASSIGNMENT is not None):
        with TemporaryDirectory() as tmp:
            extraction_dir = "tests" if filetype == "assignment" else "."
            extraction_path = Path(tmp) / extraction_dir
            if path.is_file() and path.suffix.endswith(".zip"):
                zipfile = ZipFile(path)
                zipfile.extractall(extraction_path)
            if filetype == "assignment":
                CURRENT_ASSIGNMENT = load_assignment(tmp)
                return True
            else:
                return load_homeworks()  # type: ignore


@eel.expose
def export_assignment():
    root = tk.Tk()
    root.withdraw()
    root.wm_attributes("-topmost", 1)
    fname = asksaveasfilename()
    if not fname:
        return

    build_assignment_zip(CURRENT_ASSIGNMENT, Path(fname))


@eel.expose
def create_assignment():
    global CURRENT_ASSIGNMENT
    CURRENT_ASSIGNMENT = load_assignment()
    return True


def load_assignment(dir_with_assignment: str = ""):
    paths = AutograderPaths(Path(dir_with_assignment))
    if not paths.config.exists() or not dir_with_assignment:
        config_file = paths.default_config
    else:
        config_file = paths.config
    grading_config = GradingConfig(config_file, paths.default_config)
    if sys.platform.startswith("win32"):
        grading_config.parallel_grading_enabled = False
    default_config = parse(paths.default_config.read_text())
    key_order = get_key_order(default_config)
    config: TOMLDocument = grading_config.file  # type: ignore
    sections = read_config_sections(config, default_config)
    sections.sort(key=lambda v: key_order[v["original_name"]])

    outputs = get_io_objects(paths.output_dir)
    inputs = get_io_objects(paths.input_dir)
    testcases = [
        {
            "name": test.name,
            "original_name": test.name,
            "text": test.read_text(),
            "input": get_single_io(test, inputs, paths.input_dir),
            "output": get_single_io(test, outputs, paths.output_dir),
            "config": read_config_sections(config, default_config, test),
        }
        # TODO: Add support for parsing stdout-only testcases
        for test in (paths.testcases_dir.iterdir() if paths.testcases_dir.exists() else [])
    ]
    return {"global_config": sections, "testcases": testcases}


T = TypeVar("T")


def get_key_order(doc: TOMLDocument) -> Dict[str, int]:
    return {v: i for i, v in enumerate(chain.from_iterable(doc[sec] for sec in doc))}


def get_io_objects(dir_: Path) -> Dict[str, Dict[str, str]]:
    return {p.stem: {"path": str(p), "text": p.read_text()} for p in dir_.iterdir()} if dir_.exists() else {}


def get_single_io(test: Path, io_dict: Dict[str, Dict[str, str]], dir_: Path) -> str:
    return io_dict.get(test.stem, {})["text"] if test.stem in io_dict else ""


def read_config_sections(doc: TOMLDocument, default_doc: TOMLDocument, test: Optional[Path] = None):
    return list(chain.from_iterable(read_config_section(sec, doc, default_doc, test) for sec in doc))


def read_config_section(section_name: str, config: TOMLDocument, default_config: TOMLDocument, test=None):
    section: Table = config[section_name]
    default_section: Table = default_config[section_name]
    formatted_section = (
        {
            "key": prettify(k),
            "original_name": str(k),
            "value": get_value(section.value.item(k), test),
            "description": get_comment(default_section.value.item(k)),
            "section": section_name,
            **get_type(default_section.value.item(k)),
        }
        for k in section.value
    )
    if test:
        return [c for c in formatted_section if c["is_per_testcase"]]
    else:
        return list(formatted_section)


def prettify(k: str):
    return k.replace("_", " ").lower().capitalize()


def get_type(item: Item) -> dict:
    # It's a dict
    if isinstance(item, InlineTable):
        # There's a DEFAULT value
        if item:
            v = item[DEFAULT_ARGLIST_VALUE_KEY]
            if isinstance(v, str):
                type_ = "text"
            elif isinstance(v, (int, float)):
                type_ = "number"
            else:
                raise NotImplementedError(f"Field with value {item} is not supported.")
        else:
            type_ = "text"
    elif isinstance(item, Bool):
        type_ = "checkbox"
    elif isinstance(item, (str, Array)):
        type_ = "text"
    elif isinstance(item, (int, float)):
        type_ = "number"
    else:
        raise NotImplementedError(f"Field with value {item} is not supported.")
    return {"type": type_, "is_per_testcase": isinstance(item, InlineTable), "is_list": isinstance(item, Array)}


def get_value(sec, test: Optional[Path] = None):
    if isinstance(sec, Bool):
        # Tomlkit hates bools
        return bool(sec)
    elif isinstance(sec, InlineTable):
        if DEFAULT_ARGLIST_VALUE_KEY in sec and not test:
            return sec["DEFAULT"]
        elif test and test.name in sec:
            return sec[test.name]
        # This check MIGHT be unnecessary
        elif test and test.stem in sec:
            return sec[test.stem]
        else:
            return ""
    else:
        return sec


def get_comment(v: Item) -> str:
    return v.trivia.comment.lstrip("# ")


def generate_assignment_configuration(assignment, paths: AutograderPaths):
    config = document()
    paths.tests_dir.mkdir()
    paths.input_dir.mkdir()
    paths.output_dir.mkdir()
    paths.extra_dir.mkdir()
    paths.testcases_dir.mkdir()
    paths.stdout_formatters.write_text(paths.default_stdout_formatters.read_text())
    for t in assignment["testcases"]:
        name = str(t["name"])
        (paths.testcases_dir / name).write_text(t["text"])
        (paths.input_dir / name).with_suffix(".txt").write_text(t["input"])
        (paths.output_dir / name).with_suffix(".txt").write_text(t["output"])
        for c in t["config"]:
            add_value_to_config(config, c, name)
    for c in assignment["global_config"]:
        add_value_to_config(config, c)
    paths.config.write_text(dumps(config))


def build_assignment_zip(assignment, output_fname: Path):
    with TemporaryDirectory() as tmp:
        paths = AutograderPaths(Path(tmp))
        generate_assignment_configuration(assignment, paths)
        make_archive(paths.tests_dir, output_fname)


def make_archive(source: Path, destination: Path, fmt="zip"):
    if destination.exists():
        if destination.is_file():
            destination.unlink()
        else:
            raise ValueError("You can't replace a dir with a zip, duh")
    shutil.make_archive(destination.stem, fmt, source.parents[0], source.name)
    shutil.move(f"{destination.stem}.{fmt}", destination)


def add_value_to_config(config: TOMLDocument, c: dict, testcase_name: str = DEFAULT_ARGLIST_VALUE_KEY):
    value = format_config_value(c["value"], c["type"])
    if c["section"] not in config:
        config.add(c["section"], table())
    if c["original_name"] not in config[c["section"]]:
        if c["is_per_testcase"]:
            config[c["section"]].add(c["original_name"], inline_table())
        elif c["is_list"]:
            config[c["section"]].add(c["original_name"], array())
        else:
            config[c["section"]].add(c["original_name"], item(""))
    if value is None:
        return
    if c["is_per_testcase"]:
        config[c["section"]][c["original_name"]][testcase_name] = value
    else:
        config[c["section"]][c["original_name"]] = value


def format_config_value(val, typ, is_list=False):
    if is_list:
        return array([format_config_value(v, typ) for v in val.split(",") if v]) if val else array()
    else:
        if typ == "number" and val:
            return float(val)
        elif typ == "text" and val:
            return val
        elif typ == "checkbox":
            return bool(val)


if __name__ == "__main__":
    run()
