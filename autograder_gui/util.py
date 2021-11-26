from typing import Dict, List, Optional, Tuple, Type, TypeVar, Union, cast
import sys
from typing_extensions import Literal
from zipfile import ZipFile
from autograder.config_manager import DEFAULT_ARGLIST_VALUE_KEY, ArgList, GradingConfig
from autograder.autograder import AutograderPaths
from autograder.testcase_utils.abstract_testcase import TestCase
from autograder.testcase_utils.testcase_picker import TestCasePicker
from itertools import chain
from tomlkit.api import array, document, dumps, inline_table, parse, table
from tomlkit.items import Array, Bool, InlineTable, Item, Table, item
from tomlkit.toml_document import TOMLDocument
from pathlib import Path
import shutil
from tempfile import TemporaryDirectory


DEFAULT_FORMATTERS = """
# You can specify a default formatter
# that will handle all output for
# all testcases that don't have 
# their own formatters.
def DEFAULT(output):
    \"\"\" This formatter will remove
        all whitespace from output
    \"\"\"
    return "".join(output.split())

# And you can specify formatters
# on a per-testcase basis.
def testcase_name_stem(s):
    \"\"\" This formatter will remove
        all non-digit characters
        from output
    \"\"\"
    return "".join(filter(
        lambda c: c.isdigit(), s)
    )
""".lstrip()


def load_homeworks(dir_with_homeworks: Path):
    dir_with_homeworks = skip_inner_dirs(dir_with_homeworks)
    return [{"path": f, "name": f.name, "enabled": True} for f in dir_with_homeworks.iterdir() if f.is_file()]


def skip_inner_dirs(dir_: Path) -> Path:
    contents = list(dir_.iterdir())
    if len(contents) == 1 and contents[0].is_dir():
        return skip_inner_dirs(contents[0])
    return dir_


def extract_zip_into_dir(path, extraction_path):
    zipfile = ZipFile(path)
    zipfile.extractall(extraction_path)


def load_assignment(dir_with_assignment: str = ""):
    paths = AutograderPaths(Path(dir_with_assignment))
    if paths.tests_dir.exists() and not (
        (paths.config.exists() and paths.output_dir.exists()) or (paths.testcases_dir.exists())
    ):
        paths = AutograderPaths(paths.tests_dir)
    if not paths.config.exists() or not dir_with_assignment:
        config_file = paths.default_config
    else:
        config_file = paths.config
    grading_config = GradingConfig(config_file, paths.default_config)
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
    return {
        "global_config": sections,
        "testcases": testcases,
        "testcase_types": load_testcase_types(paths.testcase_types_dir),
        "formatters": paths.stdout_formatters.read_text() if paths.stdout_formatters.is_file() else DEFAULT_FORMATTERS,
    }


def load_testcase_types(testcase_types_dir: Path) -> List[dict]:
    return [
        {"suffix": t.source_suffix.lstrip("."), "template": get_template(t)}
        for t in TestCasePicker(testcase_types_dir, False).testcase_types
    ]


def get_template(testcase_type: Type[TestCase]):
    templates = list(testcase_type.get_template_dir().iterdir())
    if templates:
        return templates[0].read_text()
    else:
        return ""


T = TypeVar("T")


def get_key_order(doc: TOMLDocument) -> Dict[str, int]:
    return {v: i for i, v in enumerate(chain.from_iterable(doc[sec] for sec in doc))}  # type: ignore


def get_io_objects(dir_: Path) -> Dict[str, Dict[str, str]]:
    return {p.stem: {"path": str(p), "text": p.read_text()} for p in dir_.iterdir()} if dir_.exists() else {}


def get_single_io(test: Path, io_dict: Dict[str, Dict[str, str]], dir_: Path) -> str:
    return io_dict.get(test.stem, {})["text"] if test.stem in io_dict else ""


def read_config_sections(doc: TOMLDocument, default_doc: TOMLDocument, test: Optional[Path] = None):
    return list(chain.from_iterable(read_config_section(sec, doc, default_doc, test) for sec in doc))


def read_config_section(section_name: str, config: TOMLDocument, default_config: TOMLDocument, test=None):
    section: Table = config[section_name]  # type: ignore
    default_section: Table = default_config[section_name]  # type: ignore
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
    paths.stdout_formatters.write_text(assignment["formatters"] if assignment["formatters"] else "")
    for c in assignment["global_config"]:
        add_value_to_config(config, c, include_comments=True)

    config_instance = GradingConfig(paths.config, paths.default_config)
    for t in assignment["testcases"]:
        name = str(t["name"])
        if not config_instance.stdout_only_grading_enabled:
            (paths.testcases_dir / name).write_text(t["text"])
        (paths.input_dir / name).with_suffix(".txt").write_text(t["input"])
        (paths.output_dir / name).with_suffix(".txt").write_text(t["output"])
        for c in t["config"]:
            add_value_to_config(config, c, name)
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


def add_value_to_config(
    config: TOMLDocument,
    c: dict,
    testcase_name: str = DEFAULT_ARGLIST_VALUE_KEY,
    include_comments=True,
):
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
    if include_comments:
        config[c["section"]][c["original_name"]].comment(c["description"])
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
