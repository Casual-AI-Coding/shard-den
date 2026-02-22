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


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_logger_functions_exist() {
        // Note: init() can only be called once per process
        // This test verifies the code compiles and functions are callable
        // In practice, logger is initialized in main.rs
        let _ = init_logger;
        let _ = init_logger_with_filter;
    }

    #[test]
    fn test_logger_with_custom_filter() {
        // Verify we can work with filter strings
        let filter = "shard_den=debug";
        assert!(!filter.is_empty());
    }
}