$scriptpath = $MyInvocation.MyCommand.Path
$dir = Split-Path $scriptpath
Push-Location $dir
python -m eel __main__.py static --collect-all=autograder -n autograder --onefile --noconsole
Pop-Location