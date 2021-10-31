from typing import List
import eel
from pathlib import Path


def run():
    eel.init("static", allowed_extensions=[".html"])
    eel.start("templates/index.html", jinja_templates="templates", size=(1200, 900), block=True)


@eel.expose
def autograder_run(config: dict, homeworks_dir: Path, selected_homeworks: List[str]):
    print("RUN", config, homeworks_dir, selected_homeworks)


@eel.expose
def autograder_plagiarism(homeworks_dir: Path, selected_homeworks: List[str]):
    pass


@eel.expose
def get_assignment_info(assignment: Path):
    assignment = Path(assignment)
    print(assignment)


@eel.expose
def export_assignment(testcases: List[dict], index: int):
    print(testcases, index)


@eel.expose
def populate_homework_array(homeworks: Path):
    print(homeworks)


if __name__ == "__main__":
    run()
