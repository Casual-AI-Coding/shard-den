//! Logging utilities

use tracing_subscriber::{fmt, EnvFilter};

/// Initialize the logging system
pub fn init_logger() {
    fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .init();
}

/// Initialize logger with custom filter
pub fn init_logger_with_filter(filter: &str) {
    fmt().with_env_filter(EnvFilter::new(filter)).init();
}
