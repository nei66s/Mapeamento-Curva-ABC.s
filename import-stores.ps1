param(
  [switch]$Geocode,
  [switch]$GeocodeOnly,
  [ValidateSet('nominatim','opencage','mapbox')][string]$Provider = 'nominatim',
  [string]$ApiKey
)

# Base API URL
$baseUrl = 'http://localhost:9002/api/stores'

# If user didn't pass an explicit API key, try environment variable (recommended for OpenCage)
if (-not $ApiKey -or $ApiKey -eq '') {
  switch ($Provider) {
    'opencage' { $ApiKey = $env:OPENCAGE_KEY }
    'mapbox' { $ApiKey = $env:MAPBOX_KEY }
    default { $ApiKey = $env:OPENCAGE_KEY }
  }
}
# Lista de lojas a adicionar (nome, endereço)
$storesToAdd = @(
  @{ name = "Americana - Loja 2"; location = "Rua do Vaticano, 30 - Sao Domingos, Americana - SP"; phone="(19) 3408-8900" },
  @{ name = "Americana - Loja 3"; location = "Rua das Castanheiras, 593 - Jardim Sao Paulo, Americana - SP"; phone="(19) 3471-2999" },
  @{ name = "Americana - Loja 5"; location = "Av. Henrique Roberto Guilherme A. Brechmacher, 2009 - Jardim Brasil, Americana - SP"; phone="(19) 3469-9700" },
  @{ name = "Americana - Loja 7"; location = "Avenida Paschoal Ardito, 700 - Sao Vito, Americana - SP"; phone="(19) 3478-8710" },
  @{ name = "Araras - Loja 24"; location = "Avenida Dona Renata, 1075 - Vila Michelin, Araras - SP"; phone="(19) 3508-0360" },
  @{ name = "Araras - Loja 25"; location = "Av. Augusta Viola da Costa, 1712 - Jardim Celina, Araras - SP"; phone="(19) 3508-0390" },
  @{ name = "Artur Nogueira - Loja 21"; location = "Estrada Municipal ATN-142, 50 - Sao Bento, Artur Nogueira - SP"; phone="(19) 3877-9600" },
  @{ name = "Boituva - Loja 20"; location = "Rua Viriato da Silva Vianna, 335 - Centro, Boituva - SP"; phone="(15) 3263-8200" },
  @{ name = "Campinas - Loja 13"; location = "Avenida Mirandopolis, 860 - Vila Pompeia, Campinas - SP"; phone="(19) 3729-6070" },
  @{ name = "Campinas - Loja 15"; location = "Rua Benedito Alves Aranha, 130 - Barao Geraldo, Campinas - SP"; phone="(19) 3749-7120" },
  @{ name = "Campinas - Loja 26"; location = "Av. Baden Powell, 2026 - Jardim Nova Europa (Parque Prado), Campinas - SP"; phone="(19) 3738-3040" },
  @{ name = "Campinas - Loja 31"; location = "Av. John Boyd Dunlop, 8930 - Jardim Satelite Iris, Campinas - SP"; phone="(19) 3729-6099" },
  @{ name = "Campinas - Loja 39"; location = "Avenida Andrade Neves, 2538 - Jardim Chapadao, Campinas - SP"; phone="(19) 3085-0825" },
  @{ name = "Campinas - Loja 43"; location = "Av. Governador Pedro de Toledo, 1900 - Bonfim, Campinas - SP"; phone="(19) 3199-2599" },
  @{ name = "Campinas - Loja 45"; location = "Av. John Boyd Dunlop, 375 - Vila Sao Bento, Campinas - SP"; phone="(19) 3199-2710" },
  @{ name = "Centro de Distribuicao - Loja 14"; location = "Rodovia Luiz de Queiroz, KM 142 - Vale das Cigarras, Santa Barbara d'Oeste - SP"; phone="(19) 3466-8100" },
  @{ name = "Complexo Administrativo - Loja 32"; location = "Rodovia Luiz de Queiroz, KM 142 - Vale das Cigarras, Santa Barbara d'Oeste - SP"; phone="(19) 3466-8100" },
  @{ name = "Hortolandia - Loja 16"; location = "Rua Benedito Leite, 358 - Jardim Santa Izabel, Hortolandia - SP"; phone="(19) 3809-6300" },
  @{ name = "Indaiatuba - Loja 11"; location = "Rua Tres Marias, 736 - Cidade Nova, Indaiatuba - SP"; phone="(19) 3825-5110" },
  @{ name = "Itu - Loja 34"; location = "Rua Ana Eufrosina de Almeida Prado, 240 - Bairro Alto, Itu - SP"; phone="(11) 2222-3170" },
  @{ name = "Limeira - Loja 27"; location = "Rua Vicente de Felice, 580 - Jardim Ouro Verde, Limeira - SP"; phone="(19) 3720-1510" },
  @{ name = "Mogi Guacu - Loja 35"; location = "Avenida Bandeirantes, 721 - Vila Pinheiro, Mogi Guacu - SP"; phone="(19) 3851-9300" },
  @{ name = "Nova Odessa - Loja 4"; location = "Avenida Ampelio Gazzetta, 1800 - Jardim Santa Rosa, Nova Odessa - SP"; phone="(19) 3466-8107" },
  @{ name = "Paulinia - Loja 10"; location = "Avenida Jose Paulino, 3405 - Nova Paulinia, Paulinia - SP"; phone="(19) 3939-7200" },
  @{ name = "Paulinia - Loja 30"; location = "Av. Joao Aranha, 470 - Alto de Pinheiros, Paulinia - SP"; phone="(19) 3199-7167" },
  @{ name = "Piracicaba - Loja 22"; location = "Rua Adelmo Cavagioni, 300 - Bairro Santa Teresinha, Piracicaba - SP"; phone="(19) 3415-9220" },
  @{ name = "Piracicaba - Loja 28"; location = "Avenida Dona Francisca, 333 - Vila Rezende, Piracicaba - SP"; phone="(19) 3412-2430" },
  @{ name = "Ribeirao Preto - Loja 44"; location = "Avenida Professor Joao F iusa, 3001 - Jardim Canada, Ribeirao Preto - SP"; phone="(16) 3600-7179" },
  @{ name = "Salto - Loja 29"; location = "Rua Nove de Julho, 1661 - Vila Nova, Salto - SP"; phone="(11) 4027-9810" },
  @{ name = "Santa Barbara d'Oeste - Loja 1"; location = "Avenida da Amizade, 2085 - Jardim Europa, Santa Barbara d'Oeste - SP"; phone="(19) 3457-9700" },
  @{ name = "Santa Barbara d'Oeste - Loja 12"; location = "Rua Maceio, 608 - Cidade Nova, Santa Barbara d'Oeste - SP"; phone="(19) 3457-9470" },
  @{ name = "Santa Barbara d'Oeste - Loja 6"; location = "Av. Prefeito Jose Maria de Araujo Junior, 935 - Jardim Firenze, Santa Barbara d'Oeste - SP"; phone="(19) 3464-9600" },
  @{ name = "Santa Barbara d'Oeste - Loja 40"; location = "Rua Treze de Maio, 1145 - Centro, Santa Barbara d'Oeste - SP"; phone="(19) 3085-0824" },
  @{ name = "Sumare - Loja 18"; location = "Estrada Municipal Valencio Calegari, 3380 - Parque Santo Antonio, Sumare - SP"; phone="(19) 3809-9600" },
  @{ name = "Sumare - Loja 8"; location = "Avenida da Amizade, 1900 - Parque Villa Flores, Sumare - SP"; phone="(19) 3803-1810" },
  @{ name = "Sumare - Loja 9"; location = "Rua Angelo Ongaro, 1017 - Vila Menuzzo, Sumare - SP"; phone="(19) 3803-1550" },
  @{ name = "Sao Joao da Boa Vista - Loja 33"; location = "Av. Dr. Oscar Piraja Martins, 1347 - Jardim Santo Andre, Sao Joao da Boa Vista - SP"; phone="(19) 3195-1350" },
  @{ name = "Sao Pedro - Loja 23"; location = "Rua Maestro Benedito Quintino, 1325 - Bairro Centro, Sao Pedro - SP"; phone="(19) 3481-9000" },
  @{ name = "Tiete - Loja 19"; location = "Rua Bela Vista, 62 - Bairro Bela Vista, Tiete - SP"; phone="(15) 3285-4830" },
  @{ name = "Tiete - Loja 42"; location = "R. Bento Antonio de Moraes, 75 - Centro, Tiete - SP"; phone="(15) 3500-6131" },
  @{ name = "Valinhos - Loja 38"; location = "Avenida Independencia, 2820 - Jardim Santo Antonio, Valinhos - SP"; phone="(19) 3199-7164" }
)

# Helper: geocode via Nominatim (used by geocode-only and add flows)
function Geocode-Address($addr, $provider = 'nominatim', $apiKey = $null) {
  switch ($provider) {
    'nominatim' {
      $url = "https://nominatim.openstreetmap.org/search?format=json&q=" + [uri]::EscapeDataString($addr)
      try {
        $res = Invoke-RestMethod -Uri $url -Headers @{ 'User-Agent' = 'Mapeamento-Curva-ABC/1.0 (your-email@example.com)'} -Method Get -UseBasicParsing
        if ($res -and $res.Count -gt 0) {
          return @{ lat = [double]$res[0].lat; lng = [double]$res[0].lon }
        }
      } catch {
        Write-Output "Geocode failed for: $addr -> $($_.Exception.Message)"
      }
    }
    'opencage' {
      if (-not $apiKey -or $apiKey -eq '') {
        Write-Output "OpenCage provider selected but no API key provided. Set OPENCAGE_KEY env var or pass -ApiKey parameter."
        return $null
      }
      # Prefer country-targeted queries for better results in Brazil
      $addrQuery = $addr + ', Brasil'
      $url = "https://api.opencagedata.com/geocode/v1/json?q=" + [uri]::EscapeDataString($addrQuery) + "&key=" + [uri]::EscapeDataString($apiKey) + "&countrycode=br&limit=1&no_annotations=1"
      try {
        $res = Invoke-RestMethod -Uri $url -Method Get -UseBasicParsing
        if ($res -and $res.results -and $res.results.Count -gt 0) {
          return @{ lat = [double]$res.results[0].geometry.lat; lng = [double]$res.results[0].geometry.lng }
        }
      } catch {
        Write-Output "OpenCage geocode failed for: $addr -> $($_.Exception.Message)"
      }
    }
    'mapbox' {
      if (-not $apiKey -or $apiKey -eq '') {
        Write-Output "Mapbox provider selected but no API key provided. Set MAPBOX_KEY env var or pass -ApiKey parameter."
        return $null
      }
      # Prefer country-targeted queries for better results in Brazil
      $addrQuery = $addr + ', Brasil'
      $url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" + [uri]::EscapeDataString($addrQuery) + ".json?access_token=" + [uri]::EscapeDataString($apiKey) + "&limit=1&country=br&autocomplete=false"
      try {
        $res = Invoke-RestMethod -Uri $url -Method Get -UseBasicParsing
        if ($res -and $res.features -and $res.features.Count -gt 0) {
          # Mapbox returns center as [lng, lat]
          $lngVal = [double]$res.features[0].center[0]
          $latVal = [double]$res.features[0].center[1]
          return @{ lat = $latVal; lng = $lngVal }
        }
      } catch {
        Write-Output "Mapbox geocode failed for: $addr -> $($_.Exception.Message)"
      }
    }
    default {
      Write-Output "Unknown geocode provider: $provider"
    }
  }
  return $null
}

function Confirm-Destructive {
  $ans = Read-Host 'ATENÇÃO: isto REMOVERÁ todas as lojas atuais. Deseja continuar? (S/N)'
  return $ans -match '^[sS]'
}

if ($GeocodeOnly) {
  # Geocode-only mode: update existing stores that have missing coordinates
  try {
    $existing = Invoke-RestMethod -Uri $baseUrl -Method Get -UseBasicParsing
  } catch {
    Write-Output "Falha ao listar lojas para geocoding: $($_.Exception.Message)"
    exit 1
  }
  if (-not $existing -or $existing.Count -eq 0) { Write-Output 'Nenhuma loja encontrada para geocoding.'; exit 0 }
  $toFix = @()
  foreach ($s in $existing) {
    try {
      $latVal = if ($null -eq $s.lat) { 0 } else { [double]$s.lat }
      $lngVal = if ($null -eq $s.lng) { 0 } else { [double]$s.lng }
    } catch { $latVal = 0; $lngVal = 0 }
    if ($latVal -eq 0 -or $lngVal -eq 0) { $toFix += $s }
  }
  if ($toFix.Count -eq 0) { Write-Output 'Nenhuma loja com lat/lng faltando.'; exit 0 }
  Write-Output "Geocoding only: found $($toFix.Count) stores to update..."
  foreach ($s in $toFix) {
    # The stores API returns `city` for the original location field; fall back to that.
    $addr = $s.location
    if (-not $addr -and $s.PSObject.Properties.Match('city').Count -gt 0) { $addr = $s.city }
    if (-not $addr) { Write-Output "Skipping id=$($s.id) (no location)"; continue }
    $g = Geocode-Address($addr, $Provider, $ApiKey)
    if ($g) {
      $body = @{ id = $s.id; lat = $g.lat; lng = $g.lng }
      try {
        $updated = Invoke-RestMethod -Uri $baseUrl -Method Put -ContentType 'application/json' -Body ($body | ConvertTo-Json) -UseBasicParsing
        Write-Output "Updated id=$($s.id) name=$($s.name) -> lat=$($g.lat) lng=$($g.lng)"
      } catch {
        Write-Output "Failed to update id=$($s.id): $($_.Exception.Message)"
      }
    } else {
      Write-Output "Geocode not found for id=$($s.id) name=$($s.name) addr='$addr'"
    }
    # Respect provider rate limits: OpenCage ~1req/s, Nominatim be more polite
    if ($Provider -eq 'opencage') { Start-Sleep -Milliseconds 1100 } else { Start-Sleep -Milliseconds 1500 }
  }
  Write-Output 'Geocode-only pass completed.'
  exit 0
}

if (-not (Confirm-Destructive)) { Write-Output 'Operação cancelada pelo usuário.'; exit 0 }

# Fetch existing stores and delete them
try {
  $existing = Invoke-RestMethod -Uri $baseUrl -Method Get -UseBasicParsing
} catch {
  Write-Output "Falha ao listar lojas: $($_.Exception.Message)"
  exit 1
}
if ($existing -and $existing.Count -gt 0) {
  Write-Output "Removendo $($existing.Count) lojas existentes..."
  foreach ($s in $existing) {
    try {
      $delId = [string]$s.id
      $deleteUri = $baseUrl + '?id=' + [uri]::EscapeDataString($delId)
      Invoke-RestMethod -Uri $deleteUri -Method Delete -UseBasicParsing
      Write-Output "Deleted store id=$delId name=$($s.name)"
    } catch {
      Write-Output "Falha ao deletar store id=$($s.id): $($_.Exception.Message)"
    }
    Start-Sleep -Milliseconds 150
  }
} else {
  Write-Output 'Nenhuma loja existente encontrada.'
}

# (geocode helper moved to top for geocode-only mode)

# Add new stores
foreach ($st in $storesToAdd) {
  $lat = $null; $lng = $null
  if ($Geocode) {
    $g = Geocode-Address($st.location, $Provider, $ApiKey)
    if ($g) { $lat = $g.lat; $lng = $g.lng }
    if ($Provider -eq 'opencage') { Start-Sleep -Milliseconds 1100 } else { Start-Sleep -Milliseconds 1200 }
  }
  $body = @{ name = $st.name; location = $st.location }
  if ($lat -ne $null -and $lng -ne $null) { $body.lat = $lat; $body.lng = $lng }
  try {
    $created = Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType 'application/json' -Body ($body | ConvertTo-Json) -UseBasicParsing
    Write-Output "Created: $($created.id) $($created.name) lat=$($created.lat) lng=$($created.lng)"
  } catch {
    Write-Output "Failed to create $($st.name): $($_.Exception.Message)"
  }
  Start-Sleep -Milliseconds 200
}

Write-Output 'Import completed.'
