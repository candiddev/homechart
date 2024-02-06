import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { TableHeaderSortAttrs } from "@lib/components/TableHeader";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import m from "mithril";
import Stream from "mithril/stream";

import { GetHelp } from "../utilities/GetHelp";

interface OSSLicense {
  [index: string]: null | string | undefined;
  licenseName: string;
  licenseLink: string;
  projectName: string;
  projectLink: string;
}

export function AboutOSSLicenses(): m.Component {
  const state: {
    columns: Stream<FilterType>;
    licenses: OSSLicense[];
    sort: Stream<TableHeaderSortAttrs>;
  } = {
    columns: Stream<FilterType>({
      projectName: "",
      licenseName: "", // eslint-disable-line sort-keys
    }),
    licenses: [
      {
        licenseLink:
          "https://github.com/chartjs/Chart.js/blob/master/LICENSE.md",
        licenseName: "MIT",
        projectLink: "https://github.com/chartjs/Chart.js",
        projectName: "Chart.js",
      },
      {
        licenseLink: "https://github.com/go-chi/chi/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/go-chi/chi",
        projectName: "chi",
      },
      {
        licenseLink: "https://github.com/browserify/events/blob/main/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/browserify/events",
        projectName: "events",
      },
      {
        licenseLink:
          "https://github.com/infusion/Fraction.js/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/infusion/Fraction.js",
        projectName: "Fraction.js",
      },
      {
        licenseLink: "https://golang.org/LICENSE",
        licenseName: "BSD",
        projectLink: "https://golang.org",
        projectName: "Go",
      },
      {
        licenseLink: "https://github.com/matoous/go-nanoid/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "github.com/matoous/go-nanoid",
        projectName: "Go Nanoid",
      },
      {
        licenseLink: "https://github.com/coreos/go-oidc/blob/v2/LICENSE",
        licenseName: "Apache 2.0",
        projectLink: "https://github.com/coreos/go-oidc",
        projectName: "go-oidc",
      },
      {
        licenseLink:
          "https://github.com/disintegration/imaging/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/disintegration/imaging",
        projectName: "imaging",
      },
      {
        licenseLink: "https://github.com/golang-jwt/jwt/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/golang-jwt/jwt",
        projectName: "jwt-go",
      },
      {
        licenseLink: "https://github.com/ulule/limiter/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/ulule/limiter",
        projectName: "Limiter",
      },
      {
        licenseLink:
          "https://github.com/localForage/localForage/blob/master/LICENSE",
        licenseName: "Apache 2.0",
        projectLink: "https://github.com/localForage/localForage",
        projectName: "localForage",
      },
      {
        licenseLink:
          "https://github.com/gomarkdown/markdown/blob/master/LICENSE.txt",
        licenseName: "BSD",
        projectLink: "https://github.com/gomarkdown/markdown",
        projectName: "Markdown Parser and HTML Renderer for Go",
      },
      {
        licenseLink:
          "https://github.com/markdown-it/markdown-it/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/markdown-it/markdown-it",
        projectName: "markdown-it",
      },
      {
        licenseLink:
          "https://github.com/MithrilJS/mithril.js/blob/next/LICENSE",
        licenseName: "MIT",
        projectLink: "https://mithril.js.org/",
        projectName: "Mithril",
      },
      {
        licenseLink:
          "https://github.com/moment/moment-timezone/blob/develop/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/moment/moment-timezone",
        projectName: "moment-timezone",
      },
      {
        licenseLink:
          "https://github.com/soldair/node-qrcode/blob/master/license",
        licenseName: "MIT",
        projectLink: "https://github.com/soldair/node-qrcode",
        projectName: "node-qrcode",
      },
      {
        licenseLink:
          "https://github.com/Leonidas-from-XIV/node-xml2js/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/Leonidas-from-XIV/node-xml2js",
        projectName: "node-xml2js",
      },
      {
        licenseLink: "https://github.com/richtr/NoSleep.js/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/richtr/NoSleep.js",
        projectName: "NoSleep.js",
      },
      {
        licenseLink:
          "https://github.com/open-telemetry/opentelemetry-js/blob/main/LICENSE",
        licenseName: "Apache 2.0",
        projectLink: "https://github.com/open-telemetry/opentelemetry-js",
        projectName: "OpenTelemetry JavaScript Client",
      },
      {
        licenseLink:
          "https://github.com/open-telemetry/opentelemetry-go/blob/main/LICENSE",
        licenseName: "Apache 2.0",
        projectLink: "https://github.com/open-telemetry/opentelemetry-go",
        projectName: "OpenTelemetry Go API and SDK",
      },
      {
        licenseLink: "https://github.com/pquerna/otp/blob/master/LICENSE",
        licenseName: "Apache 2.0",
        projectLink: "https://github.com/pquerna/otp",
        projectName: "otp",
      },
      {
        licenseLink:
          "https://github.com/hectorm/otpauth/blob/master/LICENSE.md",
        licenseName: "MIT",
        projectLink: "https://github.com/hectorm/otpauth",
        projectName: "otpauth",
      },
      {
        licenseLink: "https://github.com/mholt/PapaParse/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/mholt/PapaParse",
        projectName: "PapaParse",
      },
      {
        licenseLink:
          "https://github.com/prometheus/client_golang/blob/master/LICENSE",
        licenseName: "Apache 2.0",
        projectLink: "https://github.com/prometheus/client_golang",
        projectName: "Prometheus Go client library",
      },
      {
        licenseLink: "https://github.com/jackc/pgx/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/jackc/pgx",
        projectName: "pgx",
      },
      {
        licenseLink: "https://github.com/ericblade/quagga2/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/ericblade/quagga2",
        projectName: "quagga2",
      },
      {
        licenseLink: "https://github.com/jmoiron/sqlx/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/jmoiron/sqlx",
        projectName: "sqlx",
      },
      {
        licenseLink:
          "https://github.com/browserify/stream-browserify/blob/master/LICENSE",
        licenseName: "MIT",
        projectLink: "https://github.com/browserify/stream-browserify",
        projectName: "stream-browserify",
      },
      {
        licenseLink:
          "https://github.com/naptha/tesseract.js/blob/master/LICENSE.md",
        licenseName: "Apache 2.0",
        projectLink: "https://github.com/naptha/tesseract.js",
        projectName: "Tesseract.js",
      },
      {
        licenseLink: "https://github.com/microsoft/TypeScript",
        licenseName: "Apache 2.0",
        projectLink: "https://www.typescriptlang.org",
        projectName: "TypeScript",
      },
      {
        licenseLink: "https://github.com/google/uuid/blob/master/LICENSE",
        licenseName: "BSD 3 Clause",
        projectLink: "https://github.com/google/uuid",
        projectName: "uuid",
      },
      {
        licenseLink: "https://github.com/go-yaml/yaml/blob/v3/LICENSE",
        licenseName: "Apache 2.0/MIT",
        projectLink: "https://github.com/go-yaml/yaml",
        projectName: "YAML support for the Go language",
      },
    ],
    sort: Stream<TableHeaderSortAttrs>({
      invert: false,
      property: "projectName",
    }),
  };

  const l = Stream.lift(
    (c, s) => {
      return Filter.array(state.licenses, c, s);
    },
    state.columns,
    state.sort,
  );

  return {
    oninit: (): void => {
      AppState.setLayoutApp({
        ...GetHelp(),
        breadcrumbs: [
          {
            name: "About",
          },
          {
            name: "Open Source Licenses",
          },
        ],
        toolbarActionButtons: [],
      });
    },
    view: (): m.Children => {
      return m(Table, {
        actions: [],
        data: l(),
        filters: [],
        loaded: true,
        sort: state.sort,
        tableColumns: [
          {
            linkExternal: true,
            linkFormatter: (o: OSSLicense): string => {
              return o.projectLink;
            },
            name: "Project",
            property: "projectName",
            type: TableDataType.Link,
          },
          {
            linkExternal: true,
            linkFormatter: (o: OSSLicense): string => {
              return o.licenseLink;
            },
            name: "License",
            property: "licenseName",
            type: TableDataType.Link,
          },
        ],
        tableColumnsNameEnabled: state.columns,
        title: {
          name: "Proudly made with these Open Source Projects",
          subtitles: [
            {
              key: "Are you a contributor to these projects?",
              value: "",
            },
            {
              key: "",
              value: "Please contact us, we'd love to hear from you!",
            },
          ],
        },
      });
    },
  };
}
