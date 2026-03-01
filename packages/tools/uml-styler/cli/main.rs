//! UML Styler CLI
//!
//! Command-line tool for styling UML diagrams using various engines.

use anyhow::{anyhow, Result};
use clap::{Parser, Subcommand};
use shard_den_uml_styler::theme::{get_all_themes, Theme, ThemeCategory};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "uml-styler")]
#[command(about = "Style UML diagrams using various engines", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Style a diagram file
    Style {
        /// Input file path
        #[arg(short, long)]
        input: PathBuf,

        /// Output file path (optional, prints to stdout if not specified)
        #[arg(short, long)]
        output: Option<PathBuf>,

        /// Theme name (default, dark, forest, neutral, business, sketchy, minimal, colorful)
        #[arg(short, long, default_value = "default")]
        theme: String,

        /// Engine type (mermaid)
        #[arg(short, long, default_value = "mermaid")]
        engine: String,
    },

    /// List available themes
    Themes,

    /// List available engines
    Engines,
}

fn get_theme_by_name(name: &str) -> Result<Theme> {
    let themes = get_all_themes();

    // Try exact match first
    if let Some(theme) = themes
        .iter()
        .find(|t| t.id.ends_with(name) || t.name.to_lowercase() == name.to_lowercase())
    {
        return Ok(theme.clone());
    }

    // Try prefix match
    if let Some(theme) = themes
        .iter()
        .find(|t| t.id.contains(name) || t.name.to_lowercase().contains(&name.to_lowercase()))
    {
        return Ok(theme.clone());
    }

    Err(anyhow!("Theme '{}' not found", name))
}

fn style_mermaid(code: &str, theme: &Theme) -> Result<String> {
    let (theme_name, theme_variables) = theme.to_mermaid_config();

    let mut output = String::new();

    // Build the init directive with theme and optional themeVariables
    let init_content = if let Some(vars) = theme_variables {
        format!("'theme': '{}', {}", theme_name, vars)
    } else {
        format!("'theme': '{}'", theme_name)
    };

    output.push_str(&format!("%%{{init: {{{}}}}}%%\n", init_content));
    output.push_str(code);

    Ok(output)
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Style {
            input,
            output,
            theme,
            engine,
        } => {
            // Read input file
            let code = std::fs::read_to_string(&input)?;

            // Resolve theme
            let theme = get_theme_by_name(&theme)?;

            // Process based on engine
            let result = match engine.to_lowercase().as_str() {
                "mermaid" => style_mermaid(&code, &theme)?,
                "plantuml" => {
                    // For PlantUML, we add skinparams
                    let (theme_name, skin_params) = theme.to_plantuml_config();
                    let mut out = format!("!theme {}\n", theme_name);
                    if let Some(params) = skin_params {
                        out.push_str(&params);
                        out.push('\n');
                    }
                    out.push_str(&code);
                    out
                }
                _ => {
                    return Err(anyhow!(
                        "Unsupported engine: {}. Supported: mermaid, plantuml",
                        engine
                    ))
                }
            };

            match output {
                Some(path) => std::fs::write(path, result)?,
                None => println!("{}", result),
            }

            println!(
                "Styled diagram with theme '{}' using {} engine",
                theme.name, engine
            );
        }
        Commands::Themes => {
            let themes = get_all_themes();
            println!("\nAvailable themes:\n");

            // Group by category
            let shared: Vec<_> = themes
                .iter()
                .filter(|t| t.category == ThemeCategory::Shared)
                .collect();
            let mermaid: Vec<_> = themes
                .iter()
                .filter(|t| t.category == ThemeCategory::MermaidSpecific)
                .collect();

            println!("Shared Themes:");
            for theme in &shared {
                println!("  - {} ({})", theme.name, theme.id);
            }

            println!("\nMermaid Themes:");
            for theme in &mermaid {
                println!("  - {} ({})", theme.name, theme.id);
            }
        }
        Commands::Engines => {
            println!("Available engines:\n");
            println!("  - mermaid       Mermaid.js (sequence, flowchart, class, state, etc.)");
            println!("  - plantuml      PlantUML (sequence, class, use case, etc.)");
        }
    }

    Ok(())
}
