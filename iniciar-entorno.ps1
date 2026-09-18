$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$mysqlExe = Join-Path $taskRoot '.tools/mysql-8.4.11-winx64/bin/mysqld.exe'
if (-not (Get-Process mysqld -ErrorAction SilentlyContinue)) {
    $mysqlConfig = Join-Path $taskRoot '.tools/my.ini'
    Start-Process -FilePath $mysqlExe -ArgumentList "--defaults-file=`"$mysqlConfig`"" -WindowStyle Hidden
}
Set-Location (Join-Path $taskRoot 'finanzas-api')
php artisan serve --host=127.0.0.1 --port=8000
