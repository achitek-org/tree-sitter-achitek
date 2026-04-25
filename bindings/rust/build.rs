fn main() {
    let src_dir = std::path::Path::new("src");

    cc::Build::new()
        .include(src_dir)
        .file(src_dir.join("parser.c"))
        .flag_if_supported("-std=c11")
        .compile("tree-sitter-achitekfile");
}
