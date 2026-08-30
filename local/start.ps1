param(
    [int]$Port = 4310,
    [string]$ModelUrl = "http://127.0.0.1:8000",
    [string]$Model = ""
)

$arguments = @(
    (Join-Path $PSScriptRoot "server.py"),
    "--port", $Port,
    "--model-url", $ModelUrl
)

if ($Model) {
    $arguments += @("--model", $Model)
}

python @arguments
