//! Engine Interface - 引擎核心接口定义

// 占位结构，后续任务实现
use std::fmt::Debug;

/// 渲染提示 - 告诉前端如何渲染
#[derive(Debug, Clone)]
pub enum RenderHint {
    /// 前端 JS 渲染（如 Mermaid）
    FrontendJS,
    /// 服务器渲染 URL（如 PlantUML）
    ServerURL(String),
    /// 未来：WASM 直接渲染
    WasmReady(Vec<u8>),
}

/// 引擎 trait - 所有渲染引擎必须实现此接口
pub trait Engine: Debug + Send + Sync {
    /// 引擎名称
    fn name(&self) -> &str;
}
