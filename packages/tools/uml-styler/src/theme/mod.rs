//! 主题系统模块

// 占位结构，后续任务实现
use std::fmt::Debug;

/// 主题分类
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ThemeCategory {
    Shared,
    MermaidSpecific,
    PlantUMLSpecific,
}

/// 主题
#[derive(Debug, Clone)]
pub struct Theme {
    pub id: String,
    pub name: String,
    pub category: ThemeCategory,
}
