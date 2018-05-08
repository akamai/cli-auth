# Akamai CLI for Authentication

*NOTE:* This tool is intended to be installed via the Akamai CLI package manager, which can be retrieved from the releases page of the [Akamai CLI](https://github.com/akamai/cli) tool.

### Local Install, if you choose not to use the akamai package manager
* Node 7
* npm install after *every* update
* Ensure that the 'bin' subdirectory is in your path

### Credentials
In order to use this configuration, you need to:
* Set up your credential files as described in the [authorization](https://developer.akamai.com/introduction/Prov_Creds.html) and [credentials](https://developer.akamai.com/introduction/Conf_Client.html) sections of the getting started guide on developer.akamai.com.  
* When working through this process you need to give grants for the property manager API and the User Admin API (if you will want to move properties).  The section in your configuration file should be called 'papi'.

## Overview
The Akamai Config Kit is a set of nodejs libraries that wraps Akamai's {OPEN} APIs to help simplify common configuration tasks.  

This kit can be used in different ways:
* [As a no-fuss command line utility](#akamaiProperty) to interact with the library.
* [As a library](#library) you can integrate into your own Node.js application.
* [As a gulp integration](#gulp) to integrate with your Continuous Integration/Continuous Deployment toolset.

```
Usage: akamai auth <command> [options]

Commands:
  setup   Setup authentication for Akamai
  verify  Verify existing credentials
  import  Paste in a formatted credential block
  copy    Copy credentials from one section to a new one

General options:
  --config <config>    Config file      [file] [default: /Users/guillermofigueroa/.edgerc]
  --section <section>  Section for config file                 [string] [default: default]

Command options:
  --help     Show help                                          [commands: help] [boolean]
  --version  Show version number                             [commands: version] [boolean]

Copyright (C) Akamai Technologies, Inc
Visit http://github.com/akamai/cli-auth for detailed documentation
```

## Caveats
The Akamai CLI is a new tool and as such we have made some design choices worth mentioning.
* Edge Hostnames - if not specified, the system will create a new edge hostname, but cannot assign it as it will not yet be active.  You will need to run a 'modify' subsequently to assign the hostname.
* CPCodes - there is currently a fairly strict limitation on creation of CPCodes.  To work around this, pass in a specific CPCode to use.  Your account team can create a bunch of CPCodes which you could then use with your properties.  Cloned properties will inherit the CPCode of the cloned property.
* Credentials - the tool expects your credentials to be stored under a 'papi' section in your ~/.edgerc file.  If you are unfamiliar with the authentication and provisioning for OPEN APIs, see the "Get Started" section of https://developer.akamai.com
* Move - in order to perform move functions, the credentials must have both property manager and user admin grants.  
