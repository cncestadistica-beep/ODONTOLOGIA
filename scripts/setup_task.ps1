$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c "g:\BACKUP\juan manuel\odontologia\scripts\run_daily_sync.bat"'
$trigger = New-ScheduledTaskTrigger -Daily -At 1:00am
Register-ScheduledTask -TaskName "CNC_Odontologia_Sync_1AM" -Action $action -Trigger $trigger -Description "Sincronizacion diaria automatica de ordenamientos y citas a la 1:00 AM" -Force
