from typing import Dict, List, Optional, TypeVar, Union
from typing_extensions import Literal
import eel
from pathlib import Path
import sys

import tkinter as tk
from tkinter.filedialog import askopenfilename

from autograder.config_manager import DEFAULT_ARGLIST_VALUE_KEY, ArgList, GradingConfig
from autograder.autograder import AutograderPaths
from zipfile import ZipFile
from tempfile import TemporaryDirectory
from itertools import chain

from tomlkit.api import parse
from tomlkit.items import Array, Bool, InlineTable, Item, Table
from tomlkit.toml_document import TOMLDocument


TEMPDIR: Optional[TemporaryDirectory] = None
CURRENT_ASSIGNMENT: Optional[dict] = None

SIZE = (1200, 900)


def run():
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
def get_assignment():
    return CURRENT_ASSIGNMENT


@eel.expose
def extract_zip(filetype: str):
    global TEMPDIR
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
    if filetype == "assignment":
        TEMPDIR = TemporaryDirectory()
    elif filetype == "homeworks":
        if TEMPDIR is None or not Path(TEMPDIR.name).exists():
            return
    else:
        return
    extraction_dir = "tests" if filetype == "assignment" else "."
    extraction_path = Path(TEMPDIR.name) / extraction_dir
    if path.is_file() and path.suffix.endswith(".zip"):
        zipfile = ZipFile(path)
        zipfile.extractall(extraction_path)
    if filetype == "assignment":
        CURRENT_ASSIGNMENT = load_assignment()
        return True
    else:
        return load_homeworks()


@eel.expose
def export_assignment(testcases: List[dict], index: int):
    print(testcases, index)


@eel.expose
def populate_homework_array(homeworks: Path):
    print(homeworks)


def load_assignment():
    if TEMPDIR is None:
        raise ValueError("TEMPDIR IS NONE EVEN THOUGH IT SHOULDN'T BE")
    paths = AutograderPaths(Path(TEMPDIR.name))
    grading_config = GradingConfig(paths.config, paths.default_config)
    if sys.platform.startswith("win32"):
        grading_config.parallel_grading_enabled = False
    default_config = parse(paths.default_config.read_text())
    key_order = get_key_order(default_config)
    config = grading_config.file
    sections = read_config_sections(config, default_config)
    sections.sort(key=lambda v: key_order[v["original_name"]])

    outputs = get_io_objects(paths.output_dir)
    inputs = get_io_objects(paths.input_dir)
    testcases = [
        {
            "name": test.stem,
            "text": test.read_text(),
            "language": test.suffix.lstrip(".").capitalize(),
            "input": get_single_io(test, inputs, paths.input_dir),
            "output": get_single_io(test, outputs, paths.output_dir),
            "config": {
                "Timeout": get_without_default(grading_config.timeouts, test.name),
                "Testcase Weight": get_without_default(grading_config.testcase_weights, test.name),
                "SUBMISSION_PRECOMPILATION_ARGS": get_without_default(
                    grading_config.submission_precompilation_args,
                    test.name,
                ),
                "TESTCASE_PRECOMPILATION_ARGS": get_without_default(
                    grading_config.testcase_precompilation_args,
                    test.name,
                ),
                "TESTCASE_COMPILATION_ARGS": get_without_default(grading_config.testcase_compilation_args, test.name),
                "TESTCASE_RUNTIME_ARGS": get_without_default(grading_config.testcase_runtime_args, test.name),
            },
        }
        for test in (paths.testcases_dir.iterdir() if paths.testcases_dir.exists() else [])
    ]
    return {"global_config": sections, "testcases": testcases}


T = TypeVar("T")


def get_key_order(doc: TOMLDocument) -> Dict[str, int]:
    return {v: i for i, v in enumerate(chain.from_iterable(doc[sec] for sec in doc))}


def get_without_default(arglist: ArgList[str, T], key: str) -> Union[T, Literal[""]]:
    return arglist[key] if key in arglist.mapping else ""


def get_io_objects(dir_: Path) -> Dict[str, Dict[str, str]]:
    return {p.stem: {"path": str(p), "text": p.read_text()} for p in dir_.iterdir()} if dir_.exists() else {}


def get_single_io(test: Path, io_dict: Dict[str, Dict[str, str]], dir_: Path) -> Dict[str, str]:
    return io_dict.get(test.stem, {}) or {"path": str(dir_ / (test.stem + ".txt")), "text": ""}


def read_config_sections(doc: TOMLDocument, default_doc: TOMLDocument):
    return list(chain.from_iterable(read_config_section(doc[sec], default_doc[sec]) for sec in doc))


def read_config_section(section: Table, default_config_section: Table):
    return [
        {
            "key": prettify(k),
            "original_name": str(k),
            "value": get_value(section.value.item(k)),
            "description": get_comment(default_config_section.value.item(k)),
            **get_type(default_config_section.value.item(k)),
        }
        for k in section.value
    ]


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
    return {"type": type_, "is_per_testcase": isinstance(item, InlineTable)}


def get_value(s):
    if isinstance(s, Bool):
        # Tomlkit hates bools
        return bool(s)
    elif isinstance(s, InlineTable):
        if DEFAULT_ARGLIST_VALUE_KEY in s:
            return s["DEFAULT"]
        else:
            return ""
    else:
        return s


def get_comment(v: Item) -> str:
    return v.trivia.comment.lstrip("# ")


if __name__ == "__main__":
    run()
