//! ShardDen - Modular Developer Toolkit Platform
//!
//! A unified CLI for all ShardDen tools.

use anyhow::Result;
use clap::{Parser, Subcommand};
use shard_den_json::{JsonExtractorCore, OutputFormat};
use std::io::{self, Read};
use tracing::info;

#[derive(Parser)]
#[command(
    name = "shard-den",
    about = "ShardDen - Modular developer toolkit platform",
    version,
    long_about = None
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Extract fields from JSON using path expressions
    Extract {
        /// Path expression(s), comma-separated
        #[arg(short, long, value_name = "PATHS")]
        paths: String,

        /// Input file (stdin if not provided)
        input: Option<String>,

        /// Output format (json, csv, text, yaml)
        #[arg(short, long, value_name = "FORMAT", default_value = "json")]
        format: String,
    },
    /// Detect available paths in JSON
    Detect {
        /// Input file (stdin if not provided)
        input: Option<String>,
    },
    /// List all available tools
    Tools,
}

fn parse_format(format: &str) -> OutputFormat {
    match format.to_lowercase().as_str() {
        "csv" => OutputFormat::Csv,
        "text" => OutputFormat::Text,
        "yaml" => OutputFormat::Yaml,
        _ => OutputFormat::Json,
    }
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

fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    let cli = Cli::parse();
    let extractor = JsonExtractorCore::new();

    match cli.command {
        Commands::Extract {
            paths,
            input,
            format,
        } => {
            info!("Extracting with paths: {}", paths);
            let json = read_input(input.as_deref())?;
            let output_format = parse_format(&format);
            let result = extractor.extract_with_format(&json, &paths, output_format)?;
            println!("{}", result);
        }
        Commands::Detect { input } => {
            info!("Detecting paths in JSON");
            let json = read_input(input.as_deref())?;
            let paths = extractor.detect_paths(&json)?;
            for path in paths {
                println!("{}", path);
            }
        }
        Commands::Tools => {
            println!("Available tools:");
            println!("  extract  - Extract fields from JSON using path syntax");
            println!("  detect   - Detect available paths in JSON");
            println!("\nUse 'shard-den <command> --help' for more information.");
        }
    }

    Ok(())
}
