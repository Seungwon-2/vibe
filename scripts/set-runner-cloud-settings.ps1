# Run manually from PowerShell after az login. Never prints setting values.
$ErrorActionPreference = 'Stop'
$runnerRoot = Split-Path -Parent $PSScriptRoot
$runnerLocalPath = Join-Path $runnerRoot 'api/local.settings.json'
$runnerLocal = Get-Content -LiteralPath $runnerLocalPath -Raw | ConvertFrom-Json
$runnerKeys = @('ENTRA_TENANT_ID', 'ENTRA_API_AUDIENCE', 'ENTRA_API_SCOPE',
    'COSMOS_CONNECTION_STRING', 'COSMOS_DATABASE_ID', 'COSMOS_CONTAINER_ID')
$runnerCloudJson = az staticwebapp appsettings list --name stella-runner-project02 --resource-group grill-me-edu -o json
if ($LASTEXITCODE -ne 0) { throw 'Cannot read Stella Runner application settings.' }
$runnerCloud = $runnerCloudJson | ConvertFrom-Json
$runnerMerged = @{}
foreach ($runnerProperty in $runnerCloud.properties.PSObject.Properties) {
    $runnerMerged[$runnerProperty.Name] = $runnerProperty.Value
}
foreach ($runnerKey in $runnerKeys) {
    $runnerValue = $runnerLocal.Values.$runnerKey
    if ([string]::IsNullOrWhiteSpace($runnerValue)) { throw "Missing local setting: $runnerKey" }
    $runnerMerged[$runnerKey] = $runnerValue
}
$runnerTemp = [IO.Path]::GetTempFileName()
try {
    $runnerBody = @{ properties = $runnerMerged } | ConvertTo-Json -Depth 5
    [IO.File]::WriteAllText($runnerTemp, $runnerBody, (New-Object Text.UTF8Encoding($false)))
    $runnerUri = 'https://management.azure.com' + $runnerCloud.id + '?api-version=2025-03-01'
    az rest --method put --uri $runnerUri --body ('@' + $runnerTemp) --output none
    if ($LASTEXITCODE -ne 0) { throw 'Application settings update failed.' }
} finally {
    # Delete only the exact temporary file created above.
    Remove-Item -LiteralPath $runnerTemp -Force
}
$runnerCheckJson = az staticwebapp appsettings list --name stella-runner-project02 --resource-group grill-me-edu -o json
if ($LASTEXITCODE -ne 0) { throw 'Cannot verify application settings.' }
$runnerCheck = $runnerCheckJson | ConvertFrom-Json
foreach ($runnerKey in $runnerKeys) {
    if ([string]::IsNullOrWhiteSpace($runnerCheck.properties.$runnerKey)) {
        throw "Missing cloud setting: $runnerKey"
    }
}
Write-Output 'Stella Runner: all six server settings are configured. Values were not displayed.'
