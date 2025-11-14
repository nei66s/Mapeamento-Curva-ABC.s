$stores = Invoke-RestMethod -Uri 'http://localhost:9002/api/stores' -Method Get
$rows = @()
foreach ($s in $stores) {
  $rows += [pscustomobject]@{
    id = [string]$s.id
    name = $s.name
    location = ($s.city -or $s.location)
    lat = if ($null -ne $s.lat) { [string]$s.lat } else { '' }
    lng = if ($null -ne $s.lng) { [string]$s.lng } else { '' }
  }
}
$rows | Export-Csv -Path 'stores-for-geocoding.csv' -NoTypeInformation -Encoding UTF8
Write-Output 'WROTE stores-for-geocoding.csv'