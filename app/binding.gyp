{
  "variables": {
    "asio_sdk": "<!(node -p \"process.env.ASIO_SDK_DIR||'none'\")"
  },
  "targets": [
    {
      "target_name": "patchkamer_asio",
      "sources": [
        "native/addon.cc",
        "native/engine.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except"
      ],
      "cflags_cc": [
        "-std=c++17",
        "-O2"
      ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "AdditionalOptions": [
            "/std:c++17"
          ]
        }
      },
      "conditions": [
        [
          "OS=='win' and asio_sdk!='none'",
          {
            "defines": [
              "PK_ASIO=1"
            ],
            "sources": [
              "<(asio_sdk)/common/asio.cpp",
              "<(asio_sdk)/host/asiodrivers.cpp",
              "<(asio_sdk)/host/pc/asiolist.cpp"
            ],
            "include_dirs": [
              "<(asio_sdk)/common",
              "<(asio_sdk)/host",
              "<(asio_sdk)/host/pc"
            ],
            "libraries": [
              "ole32.lib",
              "advapi32.lib",
              "user32.lib"
            ]
          }
        ]
      ]
    }
  ]
}
