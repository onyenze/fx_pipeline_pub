$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Open("C:\Users\techa\Downloads\project-bolt-sb1-yzukifdl\project\fx_pipeline_pub\backend\macros\FX_Pipeline.xlsm")
$excel.Run("Run_Daily_Regulatory_Reporting")
$workbook.Close($true)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()