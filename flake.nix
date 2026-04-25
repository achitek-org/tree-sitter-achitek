{
  description = "Development environment for tree-sitter-achitek";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  inputs.nixpkgs-tree-sitter.url = "github:NixOS/nixpkgs/nixos-25.05";

  inputs.flake-utils.url = "github:numtide/flake-utils";

  inputs.nil.url = "github:oxalica/nil/c8e8ce72442a164d89d3fdeaae0bcc405f8c015a";

  inputs.nil.flake = true;

  outputs =
    {
      self,
      nil,
      nixpkgs,
      nixpkgs-tree-sitter,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
        pkgs-tree-sitter = import nixpkgs-tree-sitter { inherit system; };
        nix-lsp-server = nil.packages.${system}.nil;
        tree-sitter-with-web-ui = (
          pkgs-tree-sitter.tree-sitter.override {
            webUISupport = true;
          }
        );
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            clang
            nix-lsp-server
            gnumake
            just
            nodejs_24
            oxlint
            rustc
            cargo
            tree-sitter-with-web-ui
          ];

          shellHook = ''
            export CC=${pkgs.clang}/bin/clang
            echo "Entered tree-sitter-achitek dev shell"
          '';
        };
      }
    );
}
