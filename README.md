[![csivit][csivitu-shield]][csivitu-url]
[![Issues][issues-shield]][issues-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/csivitu/ctfup">
    <img src="https://csivit.com/images/favicon.png" alt="Logo" width="80">
  </a>

  <h3 align="center">ctfup</h3>

  <p align="center">
    A cli tool to deploy CTF challenges to a k8 cluster for csictf TODO: Docs
    <br />
    <a href="https://github.com/csivitu/ctfup"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/csivitu/ctfup">View Demo</a>
    ·
    <a href="https://github.com/csivitu/ctfup/issues">Report Bug</a>
    ·
    <a href="https://github.com/csivitu/ctfup/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->

## Table of Contents

- [About the Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contributors](#contributors-)

<!-- ABOUT THE PROJECT -->

## About The Project

[![Product Name Screen Shot][product-screenshot]](https://example.com)
CTFUp is an npm package developed to streamline the deployment of CTF challenges to a kubernetes cluster. 

### Built With

- [NodeJS](https://nodejs.org/en/)
- [Typescript](https://www.typescriptlang.org/)
- [Google Kubernetes](https://cloud.google.com/kubernetes-engine)

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

This package is intended to be used in your CI script, or with the appropriate Google Cloud SDK.

- npm
- [Google Cloud SDK](https://cloud.google.com/sdk)

- A Google Cloud account with the Kubernetes Engine enabled.
- A Google Cloud Service account.

### Installation

1. Clone the repo

```sh
git clone https://github.com/csivitu/ctfup.git
```


2. Install NPM packages

```sh
npm install
```

Alternatively, You may download the npm package with the command:
```sh
npm install -g ctfup
```

<!-- USAGE EXAMPLES -->

## Usage


1. Assuming you have a repository for challenges, kindly structure it as follows:

```bash
├── pwn
│   ├── pwn-challenge-1
│   │   ├── *
│   │   ├──challenge.yml
│   │   ├──Dockerfile
│   │   └──.dockerignore
│   │
│   ├── pwn-challenge-2
│   │   ├── *
│   │   ├──challenge.yml
│   │   ├──Dockerfile
│   │   └──.dockerignore
│   │
│   └── pwn-challenge-3
│
├── crypto
├── forensics
├── linux
├── reversing
├── miscellaneous
├── osint
├── pwn
├── web
└── ctfup.yml
```

The directories `pwn` , `crypto` etc. each have sub directories with each sub directory having a `challenge.yml`, a `Dockerfile` and corresponding `.dockerignore`.

2. The root directory of your repository must have a config file `ctfup.yml` as per the format.

```yaml
categories:
  - "crypto"
  - "forensics"
  - "linux"
  - "reversing"
  - "miscellaneous"
  - "osint"
  - "pwn"
  - "web"
registry: "gcr.io/<project name>-<project id>"
```

3. The format of `challenge.yml` is as follows:

```yaml
# This file represents the base specification of your challenge. It is used by
# other tools to install and deploy your challenge.

# Required sections
name: "challenge name"
author: "author"

# Select a category from:
# - Pwn
# - Web
# - OSINT
# - Linux
# - Crypto
# - Forensics
# - Reversing
# - Miscellaneous
category: category

# This is the challenge description. Make sure you include the
# necessary URLs / netcat strings here.
description: This is a sample description

# This is the number of points awarded for the challenge.
value: 500
type: dynamic

# Number of solves it takes to reach the minimum value.
decay: 450

# Minimum value.
minimum: 100

# Flags specify answers that your challenge use. You should generally provide
# at least one.
# Can be removed if unused
# Accepts strings or dictionaries
flags:
  - csictf{this_is_a_sample_flag}
  - { type: "static", content: "csictf{another_flag}", data: "asdfasdfsdf" }

# Tags are used to classify your challenge with topics. You should provide at
# least one.
# Can be removed if unused
# Accepts strings
tags:
  - web
  - sandbox
  - js

# Provide paths to files from the same directory that this file is in
# Accepts strings
files:
  - dist/source.py

# Hints are used to give players a way to buy or have suggestions. They are not
# required but can be nice.
# Can be removed if unused
# Accepts dictionaries or strings
hints:
  - { content: "This hint costs points", cost: 10 }
  - This hint is free

# The state of the challenge.
# May be "visible" or "hidden".
# It is "visible" by default.
state: hidden

# Specifies what version of the challenge specification was used.
# Subject to change until ctfcli v1.0.0
version: "0.1"

# The ports to expose. The target port will be used to access the deployed container.
expose:
- containerPort: 9999
  targetPort: 30231
```

4. The directory containing the `challenge.yml` file must _also_ contain a Dockerfile which will be used by GKE.<br><br>

5. Setup your preferred CI for your project. In this case, we will use a Github Action. <br><br>

```yaml
- uses: actions/checkout@v2
- uses: actions/setup-node@v1
  with:
    node-version: "12"
- run: npm install -g ctfup
```

6. Add the required secrets and in your `yaml` config file, set up the gcloud environment with

```yaml
uses: GoogleCloudPlatform/github-actions/setup-gcloud@master
  with:
    version: '290.0.1'
    service_account_key: ${{ secrets.GKE_SA_KEY }}
    project_id: ${{ secrets.GKE_PROJECT }}
```

Note: use the latest version of the Github Action.

7. Additional setup

```yaml
# Configure Docker to use the gcloud command-line tool as a credential
# helper for authentication
- run: |-
    gcloud --quiet auth configure-docker
# Get the GKE credentials so we can deploy to the cluster
- run: |-
    gcloud container clusters get-credentials "${{ secrets.GKE_CLUSTER_NAME }}" --zone "${{ secrets.GKE_CLUSTER_ZONE }}"
```

<br>
8. Deploy

```yaml
- name: Deploy
  run: ctfup -c ctfup.yml .
```

## Additional Features

1. Differential deployment
```sh
ctfup -c ctfup.yml -d <commit id>
```
CTFUp will calculate the difference between the commits and deploy only those challenges that have been modified since the <commit id> that is passed.

eg. 

```sh
ctfup -c ctfup.yml -d a745313b88cbe3947653b493cc968c640b28218e
```
<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/csivitu/ctfup/issues) for a list of proposed features (and known issues).

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

You are requested to follow the contribution guidelines specified in [CONTRIBUTING.md](./CONTRIBUTING.md) while contributing to the project :smile:.

<!-- LICENSE -->

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[csivitu-shield]: https://img.shields.io/badge/csivitu-csivitu-blue
[csivitu-url]: https://csivit.com
[issues-shield]: https://img.shields.io/github/issues/othneildrew/Best-README-Template.svg?style=flat-square
[issues-url]: https://github.com/csivitu/ctfup/issues
