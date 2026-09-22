{
  description = "UNSAReport monorepo system deps (languages via moon+proto)";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-26.05";
    nixpkgs-unstable.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      nixpkgs-unstable,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        unstable = import nixpkgs-unstable {
          inherit system;
          config.allowUnfree = true;
        };
      in
      {
        packages.default = pkgs.buildGoModule rec {
          pname = "unsarep";
          version = "1.0.1";
          src = ./tui;
          subPackages = [ "cmd/unsarep" ];

          vendorHash = "sha256-z9D0x0kBEFr172wJHiVW07i87PVcUHHbkfxmjZwMRZI=";

          nativeBuildInputs = [
            pkgs.pkg-config
            pkgs.makeWrapper
          ];

          buildInputs = [ pkgs.fontconfig ];

          postInstall = ''
            wrapProgram $out/bin/unsarep \
              --prefix PATH : ${
                pkgs.lib.makeBinPath [
                  unstable.typst
                ]
              }
          '';

          ldflags = [
            "-s"
            "-w"
            "-X" "github.com/UNSAReport/tui/internal/config.Version=${version}"
          ];

          meta = with pkgs.lib; {
            description = "A CLI tool for generating lab reports from markdown files.";
            homepage = "https://github.com/UNSAReport/UNSAReport";
            license = licenses.mit;
            platforms = platforms.unix ++ platforms.darwin ++ platforms.windows;
          };
        };

        packages.unsarep = self.packages.${system}.default;

        apps.default = flake-utils.lib.mkApp {
          drv = self.packages.${system}.default;
        };
        apps.unsarep = self.apps.${system}.default;

        devShells.default = pkgs.mkShell {
          LD_LIBRARY_PATH =
            with pkgs;
            lib.makeLibraryPath [
              stdenv.cc.cc
              zlib
              glib
              libxcb
              libglvnd
            ];

          packages = pkgs.lib.flatten [
            (with pkgs; [
              sops
              just
              bun
              go
              nodejs
            ])
            (with unstable; [
              moon
            ])
          ];
          shellHook = "";
          buildInputs = [ pkgs.bashInteractive ];
        };
      }
    );
}
