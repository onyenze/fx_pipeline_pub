import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {exec,spawn} from 'child_process'
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const app = express();
app.use(express.json());
app.use(cors());

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));


// Ensure we're using the complete URL without any trailing slashes
const supabaseUrl = process.env.VITE_SUPABASE_URL.trim();
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});


app.post('/generate-report', async (req, res) => {
  const  inputFileNames  = req.body.inputFiles;

  try {
    // Download macro

    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    // console.log(buckets);
    

    const { data: macroFile, error: macroError } = await supabase
      .storage
      .from('excel')
      .download('macros/FX_Pipeline.xlsm');
    
      if (macroError) {
        console.error("Macro download error:", macroError);
        throw new Error(macroError.message);
      }

      const { data: runMacroScript, error: scriptError } = await supabase
      .storage
      .from('excel')
      .download('macros/runMacro.ps1');
    
      if (scriptError) {
        console.error("Script download error:", scriptError);
        throw new Error(scriptError.message);
      }
    
      // Add directory creation to ensure the directories exist
      await fs.ensureDir(path.resolve(__dirname, 'macros'));
      await fs.ensureDir(path.resolve(__dirname, 'input'));
      await fs.ensureDir(path.resolve(__dirname, 'output'));
    
      const macroPath = path.resolve(__dirname, 'macros/FX_Pipeline.xlsm');
      await fs.outputFile(macroPath, Buffer.from(await macroFile.arrayBuffer()));
      const runMacroScriptPath = path.resolve(__dirname, 'macros/runMacro.ps1');
      await fs.outputFile(runMacroScriptPath, Buffer.from(await runMacroScript.arrayBuffer()));
      // console.log(`Macro file downloaded to: ${macroPath}`);

      // Check if inputFileNames is valid before using
      if (!Array.isArray(inputFileNames)) {
        throw new Error("inputFileNames is not an array");
      }

    // Download and save each input file
    for (const fileName of inputFileNames) {
      const { data: inputFile, error: inputError } = await supabase
        .storage
        .from('excel')
        .download(`inputs/${fileName}`);

        if (inputError) {
          console.error(`Input file download error for ${fileName}:`, inputError);
          throw new Error(`Failed to download input: ${fileName}`);
        }

        const inputPath = path.resolve(__dirname, `input/${fileName}`);
        await fs.outputFile(inputPath, Buffer.from(await inputFile.arrayBuffer()));
        // console.log(`Input file downloaded: ${fileName} to ${inputPath}`);
      }
      const outputPath = path.resolve(__dirname, 'output/report-generated.xlsx');

    // Run PowerShell command to execute Excel macro
  //   const powershellCommand = `
  //     $excel = New-Object -ComObject Excel.Application
  //     $excel.Visible = $true
  //     $workbook = $excel.Workbooks.Open('${macroPath}')
    
  //       $excel.Run('Run_Daily_Regulatory_Reporting')
  //       Write-Host 'Macro executed and file saved successfully'
      
  //     [System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
  //     [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
  //     [System.GC]::Collect()
  //     [System.GC]::WaitForPendingFinalizers()
  // `;
  //   console.log(macroPath);
    
  //   // Use Promise to wait for exec to complete
  // await new Promise((resolve, reject) => {
  //   exec(powershellCommand, (error, stdout, stderr) => {
  //     if (error) {
  //       console.error(`Error executing Excel macro: ${error}`);
  //       reject(error);
  //       return;
  //     }
  //     console.log('Macro executed successfully');
  //     console.log('stdout:', stdout);
  //     console.log('stderr:', stderr);
  //     resolve();
  //   });
  // });



    

    const __filename = fileURLToPath(import.meta.url);
    // const __dirname = path.dirname(__filename);

    // Construct the path to the PowerShell script
    const scriptPath = path.join(__dirname, 'macros', 'runMacro.ps1');
    

    // Construct the path to the Excel workbook
    const workbookPath = path.join(__dirname, 'macros', 'FX_Pipeline.xlsm');

    // Spawn the PowerShell process
    const ps = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-WorkbookPath', workbookPath
    ]);

    ps.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    ps.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    ps.on('close', (code) => {
      console.log(`PowerShell script exited with code ${code}`);
    });




    res.status(200).json({message:'Report generation Successful'});

  } catch (err) {
    console.error('Report generation failed:', err);
    res.status(500).json({'Report generation failed: Could not load macro file.': err.message });
  }
});


app.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
});