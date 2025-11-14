$q=[uri]::EscapeDataString('Rua do Vaticano, 30 - Sao Domingos, Americana - SP')
$res=Invoke-RestMethod -Uri ("https://nominatim.openstreetmap.org/search?format=json&q=" + $q) -Headers @{ 'User-Agent' = 'Mapeamento-Curva-ABC/1.0 (your-email@example.com)'} -UseBasicParsing
$res | ConvertTo-Json -Depth 4
Write-Output "COUNT: $($res.Count)"