<!--
This README is created based on template available at https://github.com/othneildrew/Best-README-Template
Almost all the comments are left untouched.
-->
<a id="readme-top"></a>



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h1> [Wirecracker logo] </h1>
  <!--<a href="https://github.com/github_username/repo_name">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>-->

# Wirecracker


[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]


  <p align="center">
    A planning tool for epileptologists
    <br />
    <a href="https://www.wirecracker.com/documentations"><strong>Visit documentations</strong></a>
    <br />
    <br />
    <a href="https://www.wirecracker.com">Visit site</a>
    &middot;
    <a href="https://github.com/UCD-193AB-ws24/Wirecracker/issues/new?template=bug_report.md">Report Bug</a>
    &middot;
    <a href="https://github.com/UCD-193AB-ws24/Wirecracker/issues/new?template=feature_request.md">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

<!-- Screenshot -->
<!-- [![Product Name Screen Shot][product-screenshot]](https://example.com) -->
_[Add screenshot of "home page"]_

Wirecracker provides a intuitive solution for designing, executing, and managing localization and stimulation plans.
Key Development Goalst:
- Replace traditional CSV-based interfaces with a modern, user-friendly GUI for improved usability and efficiency.
- Facilitate smooth communication and data sharing between teams to enhance productivity and reduce errors.
- Build a centralized, well-organized database to store plans, enabling quick retrieval and analysis.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

This section provides a guide for self-hosting. If you are developer, please visit [documentation for developers](https://www.wirecracker.com/documentations/code)

### Prerequisites

Followings are required to host your own Wirecracker
* [node.js](https://nodejs.org/en)
* [npm](https://www.npmjs.com/)
* [supabase token](https://supabase.com/)
* [Google OAuth 2 token](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/UCD-193AB-ws24/Wirecracker.git
   ```
2. Go into project folder
   ```sh
   cd Wirecracker
   ```
3. Configure hosting environment variables in `.env`
   
   `./.env`
   ```filename="./.env"
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
   `./backend/.env`
   ```flename="backend/.env"
   RESEND_API_KEY=
   SUPABASE_URL=
   SUPABASE_KEY=
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   SESSION_SECRET=
   ```
5. Install NPM packages for backend and start it
   ```sh
   (cd backend; npm install; npm start)&
   ```
6. Install NPM packages for frontend and start it 
   ```sh
   npm install; npm run dev
   ```
7. Change git remote url to avoid accidental pushes to base project
   ```sh
   git remote set-url origin github_username/repo_name
   git remote -v # confirm the changes
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

How to use the web app. Additional screenshots and demos. Can be linked to more resources.

_For more examples, please refer to the [Documentation](https://www.wirecracker.com/documentations)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make this project keep going. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/UCD-193AB-ws24/Wirecracker/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=UCD-193AB-ws24/Wirecracker" alt="contrib.rocks image" />
</a>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

Name - email@email_client.com

Project Link: [https://github.com/UCD-193AB-ws24/Wirecracker](https://github.com/UCD-193AB-ws24/Wirecracker)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Tools for NIfTI and ANALYZE image](https://www.mathworks.com/matlabcentral/fileexchange/8797-tools-for-nifti-and-analyze-image) by Jimmy Shen

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/UCD-193AB-ws24/Wirecracker.svg?style=flat-square&logo=github&logoColor=white"
[contributors-url]: https://github.com/UCD-193AB-ws24/Wirecracker/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/UCD-193AB-ws24/Wirecracker.svg?style=flat-square&logo=github&logoColor=white"
[forks-url]: https://github.com/UCD-193AB-ws24/Wirecracker/network/members
[stars-shield]: https://img.shields.io/github/stars/UCD-193AB-ws24/Wirecracker.svg?style=flat-square&logo=github&logoColor=white"
[stars-url]: https://github.com/UCD-193AB-ws24/Wirecracker/stargazers
[issues-shield]: https://img.shields.io/github/issues/UCD-193AB-ws24/Wirecracker.svg?style=flat-square&logo=github&logoColor=white"
[issues-url]: https://github.com/UCD-193AB-ws24/Wirecracker/issues
[product-screenshot]: images/screenshot.png
