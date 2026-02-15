//! CLI for JSON Extractor

use anyhow::Result;
use clap::{Parser, Subcommand};
use shard_den_json::{JsonExtractorCore, OutputFormat};
use std::io::{self, Read};
use tracing::{info, warn};

#[derive(Parser)]
#[command(
    name = "shard-den-json",
    about = "Extract fields from JSON using path syntax",
    version
)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,

    /// Path expression(s), comma-separated
    #[arg(short, long, value_name = "PATHS")]
    paths: Option<String>,

    /// Output format (json, csv, text, yaml)
    #[arg(short, long, value_name = "FORMAT", default_value = "json")]
    format: String,

    /// Auto-detect available paths
    #[arg(long)]
    detect: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Extract fields using path expressions
    Extract {
        /// Path expression(s)
        #[arg(short, long)]
        paths: String,

        /// Input file (stdin if not provided)
        input: Option<String>,

        /// Output format (json, csv, text, yaml)
        #[arg(short, long, default_value = "json")]
        format: String,
    },
    /// Detect available paths in JSON
    Detect {
        /// Input file (stdin if not provided)
        input: Option<String>,
    },
}

fn parse_format(format: &str) -> OutputFormat {
    match format.to_lowercase().as_str() {
        "csv" => OutputFormat::Csv,
        "text" => OutputFormat::Text,
        "yaml" => OutputFormat::Yaml,
        _ => OutputFormat::Json,
    }
}

fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    let cli = Cli::parse();
    let extractor = JsonExtractorCore::new();

    info!("Starting JSON Extractor CLI");

    match cli.command {
        Some(Commands::Extract {
            paths,
            input,
            format,
        }) => {
            let json = read_input(input.as_deref())?;
            let output_format = parse_format(&format);
            let result = extractor.extract_with_format(&json, &paths, output_format)?;
            println!("{}", result);
        }
        Some(Commands::Detect { input }) => {
            let json = read_input(input.as_deref())?;
            let result = extractor.detect_paths(&json)?;
            println!("{:?}", result);
        }
        None => {
            // Handle args directly
            if cli.detect {
                let json = read_input(None)?;
                let result = extractor.detect_paths(&json)?;
                println!("{:?}", result);
            } else if let Some(paths) = cli.paths {
                let json = read_input(None)?;
                let output_format = parse_format(&cli.format);
                let result = extractor.extract_with_format(&json, &paths, output_format)?;
                println!("{}", result);
            } else {
                warn!("No operation specified. Use --help for usage.");
            }
        }
    }

    Ok(())
}

fn read_input(path: Option<&str>) -> Result<String> {
    match path {
        Some(p) => std::fs::read_to_string(p).map_err(Into::into),
        None => {
            let mut buffer = String::new();
            io::stdin().read_to_string(&mut buffer)?;
            Ok(buffer)
        }
    }
}
