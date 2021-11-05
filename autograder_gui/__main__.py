import json
import os
import shutil
from typing import Dict, List, Optional, Union
from autograder.autograder import AutograderPaths
import eel
from pathlib import Path

import tkinter as tk
from tkinter.filedialog import askopenfilename, asksaveasfilename


from tempfile import TemporaryDirectory
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO


from autograder_gui.util import (
    extract_zip_into_dir,
    generate_assignment_configuration,
    load_assignment,
    build_assignment_zip,
    load_homeworks,
    make_archive,
    skip_inner_dirs,
)

from autograder.__main__ import main as autograder


TEMPDIR: Optional[TemporaryDirectory] = None
CURRENT_ASSIGNMENT: Optional[dict] = None
HOMEWORK_ROOT_DIR: Optional[TemporaryDirectory] = None
HOMEWORKS: Optional[List[Dict[str, Union[str, bool]]]] = None
GRADING_RESULTS = None
PLAGIARISM_RESULTS = None

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
def autograder_run():
    global GRADING_RESULTS
    if not HOMEWORKS or not HOMEWORK_ROOT_DIR:
        return
    if GRADING_RESULTS:
        return GRADING_RESULTS
    # Temporary value to signall that we started grading
    GRADING_RESULTS = "TEMP"

    root_dir = skip_inner_dirs(Path(HOMEWORK_ROOT_DIR.name))
    argv = ["run", str(root_dir), "-j", "-s", *(h["name"] for h in HOMEWORKS if h["enabled"])]
    generate_assignment_configuration(CURRENT_ASSIGNMENT, AutograderPaths(root_dir))
    with StringIO() as buf:
        with redirect_stdout(buf):
            autograder(argv)
        GRADING_RESULTS = json.loads(buf.getvalue())
        return GRADING_RESULTS


@eel.expose
def export_grading_results():
    if GRADING_RESULTS == "TEMP" or not GRADING_RESULTS or HOMEWORK_ROOT_DIR is None:
        return

    root = tk.Tk()
    root.withdraw()
    root.wm_attributes("-topmost", 1)
    dst = Path(asksaveasfilename(defaultextension=".zip"))
    root_dir = skip_inner_dirs(Path(HOMEWORK_ROOT_DIR.name))
    paths = AutograderPaths(root_dir)
    with TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        if paths.results_dir.exists():
            shutil.copytree(paths.results_dir, tmp / paths.results_dir.name)
        (tmp / "results.json").write_text(json.dumps(GRADING_RESULTS, indent=4))
        import csv

        with (tmp / "results.csv").open("w", newline="") as csvfile:
            spamwriter = csv.writer(csvfile, delimiter=" ", quotechar="|", quoting=csv.QUOTE_MINIMAL)
            spamwriter.writerow(["submission_name", "grade"])
            for r in GRADING_RESULTS["submissions"]:
                spamwriter.writerow([r["submission"], r["final_grade"]])
        if dst.is_file():
            dst.unlink()
        make_archive(tmp, dst)


@eel.expose
def erase_grading_results():
    global GRADING_RESULTS
    if GRADING_RESULTS == "TEMP":
        return
    if HOMEWORK_ROOT_DIR is not None:
        root_dir = skip_inner_dirs(Path(HOMEWORK_ROOT_DIR.name))
        paths = AutograderPaths(root_dir)
        shutil.rmtree(paths.tests_dir, ignore_errors=True)
    GRADING_RESULTS = None


@eel.expose
def autograder_plagiarism():
    global PLAGIARISM_RESULTS
    if not HOMEWORK_ROOT_DIR:
        return
    if not HOMEWORKS or not HOMEWORK_ROOT_DIR:
        return
    if PLAGIARISM_RESULTS:
        return PLAGIARISM_RESULTS
    # Temporary value to signal that we started checking
    PLAGIARISM_RESULTS = "TEMP"

    root_dir = skip_inner_dirs(Path(HOMEWORK_ROOT_DIR.name))
    # argv = ["plagiarism", str(root_dir), "-s", *(h["name"] for h in HOMEWORKS if h["enabled"])]
    argv = ["plagiarism", str(root_dir)]
    with StringIO() as buf:
        with redirect_stdout(buf):
            autograder(argv)
        PLAGIARISM_RESULTS = json.loads(buf.getvalue())
        return PLAGIARISM_RESULTS


@eel.expose
def erase_plagiarism_results():
    global PLAGIARISM_RESULTS
    if PLAGIARISM_RESULTS == "TEMP":
        return
    PLAGIARISM_RESULTS = None


@eel.expose
def save_assignment(assignment: dict):
    global CURRENT_ASSIGNMENT
    CURRENT_ASSIGNMENT = assignment


@eel.expose
def save_homeworks(homeworks: list):
    global HOMEWORKS
    HOMEWORKS = homeworks


@eel.expose
def get_assignment():
    return CURRENT_ASSIGNMENT


@eel.expose
def get_homeworks():
    return HOMEWORKS


@eel.expose
def extract_zip(filetype: str):
    global CURRENT_ASSIGNMENT
    global HOMEWORKS
    global HOMEWORK_ROOT_DIR
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
    tmp = TemporaryDirectory()
    paths = AutograderPaths(Path(tmp.name))
    extraction_dir = paths.tests_dir if filetype == "assignment" else paths.current_dir
    extraction_path = Path(tmp.name) / extraction_dir
    if path.is_file() and path.suffix.endswith(".zip"):
        extract_zip_into_dir(path, extraction_path)
    if filetype == "assignment":
        CURRENT_ASSIGNMENT = load_assignment(tmp.name)
        return CURRENT_ASSIGNMENT
    else:
        HOMEWORKS = load_homeworks(Path(tmp.name))
        if HOMEWORK_ROOT_DIR:
            HOMEWORK_ROOT_DIR.cleanup()
        HOMEWORK_ROOT_DIR = tmp
        return HOMEWORKS


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


if __name__ == "__main__":
    run()
