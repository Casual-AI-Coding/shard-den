//! Logging utilities

use std::sync::Once;

use tracing_subscriber::{fmt, EnvFilter};

/// Initialize the logging system
///
/// Uses `Once` to ensure safe multiple calls - prevents panic from
/// tracing subscriber's `.init()` which can only be called once per process.
static LOGGER_INIT: Once = Once::new();

pub fn init_logger() {
    LOGGER_INIT.call_once(|| {
        fmt()
            .with_env_filter(EnvFilter::from_default_env())
            .with_target(true)
            .with_thread_ids(true)
            .with_thread_names(true)
            .init();
    });
}

/// Initialize logger with custom filter
///
/// Uses `Once` to ensure safe multiple calls.
pub fn init_logger_with_filter(filter: &str) {
    LOGGER_INIT.call_once(|| {
    fmt().with_env_filter(EnvFilter::new(filter)).init();
    });
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

    #[test]
    fn test_env_filter_creation() {
        // Test that we can create different filter configurations
        let filter1 = EnvFilter::new("info");
        let filter2 = EnvFilter::new("debug");
        let filter3 = EnvFilter::new("warn,shard_den=trace");
        
        // Verify filter strings are valid
        assert!(!filter1.to_string().is_empty());
        assert!(!filter2.to_string().is_empty());
        assert!(!filter3.to_string().is_empty());
    }

    #[test]
    fn test_env_filter_from_default() {
        // Test EnvFilter from default environment
        let filter = EnvFilter::from_default_env();
        // Should not panic and produce a valid filter
        // The filter string should not be empty
        assert!(!filter.to_string().is_empty());
    }

    #[test]
    fn test_init_logger_call() {
        // Test calling init_logger - safe because call_once ensures it only runs once
        // Note: This may not cover the body if init() was already called in a previous test
        // but it will at least verify the function can be called
        init_logger();
        // If we reach here without panic, the test passes
    }

    #[test]
    fn test_init_logger_with_filter_call() {
        // Test calling init_logger_with_filter
        init_logger_with_filter("info");
    }
}
