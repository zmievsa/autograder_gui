import json
import os
import shutil
from typing import Dict, List, Optional, Union, overload
from autograder.autograder import AutograderPaths
import eel
from pathlib import Path

import tkinter as tk
from tkinter import filedialog
import csv


from tempfile import TemporaryDirectory
from contextlib import redirect_stdout
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

AUTOGRADER_RUN_IN_PROGRESS = "PROGRESS"

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
    GRADING_RESULTS = AUTOGRADER_RUN_IN_PROGRESS

    root_dir = skip_inner_dirs(Path(HOMEWORK_ROOT_DIR.name))
    argv = ["run", str(root_dir), "-j", "-s", *(h["name"] for h in HOMEWORKS if h["enabled"])]
    generate_assignment_configuration(CURRENT_ASSIGNMENT, AutograderPaths(root_dir))
    with StringIO() as buf:
        with redirect_stdout(buf):
            try:
                autograder(argv)
            except Exception as e:
                GRADING_RESULTS = None
                return {"error": str(e)}
        GRADING_RESULTS = json.loads(buf.getvalue())
        return GRADING_RESULTS


@eel.expose
def export_grading_results():
    if GRADING_RESULTS == AUTOGRADER_RUN_IN_PROGRESS or not GRADING_RESULTS or HOMEWORK_ROOT_DIR is None:
        return

    spawn_tkinter_window()
    dst = Path(filedialog.asksaveasfilename(filetypes=[("Zip File", ".zip")]))
    root_dir = skip_inner_dirs(Path(HOMEWORK_ROOT_DIR.name))
    paths = AutograderPaths(root_dir)
    with TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        if paths.results_dir.exists():
            shutil.copytree(paths.results_dir, tmp / paths.results_dir.name)
        (tmp / "results.json").write_text(json.dumps(GRADING_RESULTS, indent=4))

        with (tmp / "results.csv").open("w", newline="") as csvfile:
            spamwriter = csv.writer(csvfile, delimiter=";", quotechar="|", quoting=csv.QUOTE_MINIMAL)
            spamwriter.writerow(["submission_name", "grade"])
            for r in GRADING_RESULTS["submissions"]:
                spamwriter.writerow([r["submission"], r["final_grade"]])
        if dst.is_file():
            dst.unlink()
        make_archive(tmp, dst)


@eel.expose
def erase_grading_results():
    global GRADING_RESULTS
    if GRADING_RESULTS == AUTOGRADER_RUN_IN_PROGRESS:
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
    PLAGIARISM_RESULTS = AUTOGRADER_RUN_IN_PROGRESS

    root_dir = skip_inner_dirs(Path(HOMEWORK_ROOT_DIR.name))
    argv = ["plagiarism", str(root_dir), "-s", *(h["name"] for h in HOMEWORKS if h["enabled"])]
    with StringIO() as buf:
        with redirect_stdout(buf):
            try:
                autograder(argv)
            except Exception as e:
                PLAGIARISM_RESULTS = None
                return {"error": str(e)}
        PLAGIARISM_RESULTS = json.loads(buf.getvalue())
        return PLAGIARISM_RESULTS


@eel.expose
def erase_plagiarism_results():
    global PLAGIARISM_RESULTS
    if PLAGIARISM_RESULTS == AUTOGRADER_RUN_IN_PROGRESS:
        return
    PLAGIARISM_RESULTS = None


@eel.expose
def export_plagiarism_results():
    if PLAGIARISM_RESULTS == AUTOGRADER_RUN_IN_PROGRESS or not PLAGIARISM_RESULTS:
        return

    spawn_tkinter_window()
    dst = Path(filedialog.asksaveasfilename(filetypes=[("Zip File", ".zip")]))
    with TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (tmp / "plagiarism_results.json").write_text(json.dumps(PLAGIARISM_RESULTS, indent=4))

        with (tmp / "plagiarism_results.csv").open("w", newline="") as csvfile:
            spamwriter = csv.writer(csvfile, delimiter=";", quotechar="|", quoting=csv.QUOTE_MINIMAL)
            spamwriter.writerow(["Submission 1", "Submission 2", "Similarity Score"])
            for r in PLAGIARISM_RESULTS["results"]:
                spamwriter.writerow([r["student1"], r["student2"], r["similarity_score"]])
        if dst.is_file():
            dst.unlink()
        make_archive(tmp, dst)


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


def spawn_tkinter_window():
    root = tk.Tk()
    root.withdraw()
    root.wm_attributes("-topmost", 1)
    return root


@eel.expose
def extract_assignment():
    global CURRENT_ASSIGNMENT

    spawn_tkinter_window().title("Choose files to open")
    chosen_paths: str = filedialog.askopenfilename(filetypes=[("Assignment file", "*.zip")])
    if not chosen_paths:
        return {"error": "No path was chosen"}
    path = Path(chosen_paths)
    if not path.is_file():
        return {"error": f"The path '{path}' is not a file."}
    with TemporaryDirectory() as tmp:
        paths = AutograderPaths(Path(tmp))
        extract_zip_into_dir(path, paths.tests_dir)
        CURRENT_ASSIGNMENT = load_assignment(tmp)
        return CURRENT_ASSIGNMENT


@eel.expose
def extract_homeworks():
    global HOMEWORKS
    global HOMEWORK_ROOT_DIR

    spawn_tkinter_window().title("Choose files to open")
    chosen_paths = filedialog.askopenfilenames(
        filetypes=[("Archive with student submissions", "*.zip"), ("Student Submissions", "*")]
    )
    if not chosen_paths:
        return {"error": "No path was chosen"}
    non_existent_paths = [f"'{p}'" for p in chosen_paths if not os.path.isfile(p)]
    if non_existent_paths:
        return {"error": f"Picked paths do not exist. Paths: {', '.join(non_existent_paths)}"}
    tmp = TemporaryDirectory()
    extraction_dir = Path(tmp.name)
    if len(chosen_paths) == 1 or chosen_paths[0].endswith(".zip"):
        extract_zip_into_dir(chosen_paths[0], extraction_dir)
    else:
        for f in chosen_paths:
            shutil.copy(f, extraction_dir)
    HOMEWORKS = load_homeworks(extraction_dir)
    if HOMEWORK_ROOT_DIR:
        HOMEWORK_ROOT_DIR.cleanup()
    HOMEWORK_ROOT_DIR = tmp
    return HOMEWORKS


@eel.expose
def export_assignment():
    spawn_tkinter_window()
    fname = filedialog.asksaveasfilename()
    if not fname:
        return {"error": "No path was chosen"}

    build_assignment_zip(CURRENT_ASSIGNMENT, Path(fname))


@eel.expose
def create_assignment():
    global CURRENT_ASSIGNMENT
    CURRENT_ASSIGNMENT = load_assignment()
    return True


if __name__ == "__main__":
    run()
