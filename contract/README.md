# contract

*Nederlandse versie: [README_NL.md](README_NL.md)*

The agreements between the host ([patchkamer](../patchkamer/)) and the [devices](../devices/). Anyone, human or AI, who builds a device that follows this contract can do so without conditions. The contract is in English ([PATCHKAMER-CONTRACT_EN.md](PATCHKAMER-CONTRACT_EN.md)) and Dutch ([PATCHKAMER-CONTRACT_NL.md](PATCHKAMER-CONTRACT_NL.md)), and the validator [validate-instrument.mjs](validate-instrument.mjs) checks a device against it.

## License

MIT. A device that follows the contract is therefore not a derived work of the host. The maker chooses the license of their own device. See [LICENSE](LICENSE) and [LICENSING.md](../LICENSING.md) (in Dutch).

## Version

The contract is the only part with a version number (semver): a breaking change raises the major number. A device or song names the contract version it was built for. Contract, validator and host always have the same version.
