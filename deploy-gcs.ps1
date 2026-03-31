# Sync site to Google Cloud Storage (exclude .git — use ^\.git for Windows paths).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$gsutil = Join-Path $env:LocalAppData "Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd"
if (-not (Test-Path $gsutil)) { $gsutil = "gsutil" }
$BUCKET = "gs://gt3d-website-2026-web"
& $gsutil -m rsync -r -d -x "^\.git" . $BUCKET
# HTML/CSS/JS: avoid long-lived edge/browser cache so form and content updates show up after deploy.
# (If you use Cloud CDN in front of the bucket, also invalidate the URL map or cache for these paths when needed.)
$cacheUris = @()
Get-ChildItem -Path $PSScriptRoot -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch '\\\.git\\' -and $_.Extension -match '^\.(html|css|js)$' } |
  ForEach-Object {
    $rel = $_.FullName.Substring($PSScriptRoot.Length + 1).Replace('\', '/')
    $cacheUris += "$BUCKET/$rel"
  }
if ($cacheUris.Count -gt 0) {
  & $gsutil -m setmeta -h "Cache-Control:public, max-age=0, must-revalidate" @cacheUris
}
# Ensure MP4s play inline in <video> (rsync can leave application/octet-stream on some systems).
Get-ChildItem -Path $PSScriptRoot -Recurse -Filter *.mp4 -File -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch '\\\.git\\' } |
  ForEach-Object {
    $rel = $_.FullName.Substring($PSScriptRoot.Length + 1).Replace('\', '/')
    & $gsutil setmeta -h "Content-Type:video/mp4" "$BUCKET/$rel"
  }
