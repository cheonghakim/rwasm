use wasm_bindgen::prelude::*;

// 두 숫자를 더합니다.
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 이름을 전달받아 인사말을 반환합니다.
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
