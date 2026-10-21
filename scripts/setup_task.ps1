# Script para registrar la tarea programada en Windows con inicio automatico si la maquina estaba apagada
$taskName = "CNC_Odontologia_Sync_1AM"
$workDir = "g:\BACKUP\juan manuel\odontologia"
$scriptPath = "$workDir\scripts\run_daily_sync.bat"

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$scriptPath`"" -WorkingDirectory $workDir
$trigger = New-ScheduledTaskTrigger -Daily -At 1:00am
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Sincronizacion diaria automatica de datos estadisticos a la 1:00 AM" `
    -Force

Write-Host "Tarea programada $taskName configurada exitosamente."
