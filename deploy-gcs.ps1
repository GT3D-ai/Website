# Sync site to Google Cloud Storage (exclude .git — use ^\.git for Windows paths).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$gsutil = Join-Path $env:LocalAppData "Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd"
if (-not (Test-Path $gsutil)) { $gsutil = "gsutil" }
$BUCKET = "gs://gt3d-website-2026-web"
& $gsutil -m rsync -r -d -x "^\.git" . $BUCKET
