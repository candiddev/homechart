import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { AppState } from "@lib/states/App";
import m from "mithril";

import { GetHelp } from "../utilities/GetHelp";

const tos = [
  {
    content: `Homechart ("Service") is provided by Candid Development LLC ("Candid Development"). By using our Service, you are agreeing to these Terms of Service ("Terms") and certify that you are over the age of 13. Please read these terms carefully before using our Service.`, // eslint-disable-line quotes
    header: "Introduction",
  },
  {
    content: `Candid Development may modify existing terms and/or update these terms with additional terms that apply to the Service. You should check the terms regularly to keep informed. Candid Development will also post notice of modification to these Terms on this page or via the email address you registered with us. Changes will not apply retroactively and will become effective thirty (30) days after they are posted on our website. Changes addressing new functions for the Service or changes made for legal reasons may be effective immediately. You should discontinue your use of our Service if you do not agree with the updated/modified Terms.`, // eslint-disable-line quotes
    header: "Changes to the Terms of Service",
  },
  {
    content: `Homechart's privacy policies explain how we treat your personal data and protect your privacy when using our Service. By using our Service, you automatically agree to our privacy policies and Candid Development can use such data in accordance with its privacy policies.`, // eslint-disable-line quotes
    header: "Privacy",
  },
  {
    content: `Our service allows you to upload, download and store content, including but not limited to: information, text, graphics, or other material ("Content"). You retain ownership of any intellectual property rights that you hold in that Content. When you upload, store, send or receive Content to or through our Service, you give Candid Development and its service partners a worldwide license to host, store, upload and download this Content and only for the purpose of providing Service strictly to you and your use of the Content. We reserve our right at all times, but are not obligated, to remove or refuse to distribute any Content through the Service including your Content.`, // eslint-disable-line quotes
    header: "Your Content",
  },
  {
    content: `When the Service requires or includes downloadable software, this software may update automatically on your device once a new version or features become available to you. Some platforms may let you adjust your automatic update settings.

Candid Development gives you a personal, worldwide, royalty-free, non-assignable and non-exclusive license to use the software provided by Candid Development as part of the Service. You may not copy, modify, distribute, sell, or lease any part of our Service or included software, nor may you reverse engineer or attempt to extract the source code of the software, unless local laws prohibit those restrictions or you have our written permission.`, // eslint-disable-line quotes
    header: "Our Software",
  },
  {
    content: `Candid Development may add or remove functionalities or features in the normal course of improving, changing, and/or updating the Service. We may also suspend or stop our Service with at least thirty (30) days notice prior to the complete shutdown of our Service.

You can choose to stop using our Service at will. We may also stop providing Service to you, or add or create new limitations to our Service at any time as detailed in the Terms.`, // eslint-disable-line quotes
    header: "Service Modification and Termination",
  },
  {
    content: `You may access your Service data via the Application Program Interface (“API”). By using API, you are automatically bound by the Terms.`, // eslint-disable-line quotes
    header: "API Usage",
  },
  {
    content: `You must follow any policies made available to you within the Service. You may only use our Service as permitted by law. Candid Development may investigate and/or suspend or terminate our Service to you at any time if we find your use of our Service violates the Terms and/or any policies.

Using our Service does not grant you ownership of any intellectual property rights in our Service or the content you may have access to. You may not use any copyrighted content in our Service unless you obtain permission from the content owner and/or are otherwise permitted by law. The Terms do not grant you the right to use any branding or logos used in our Service. Our Service may display some logos, trademarks, or branding materials that is not the property of Candid Development. These types of content are the sole responsibility of the entity that makes it available.

You must not abuse and/or misuse our Service, including but not limited to, doing the following things:

- Using the Service for any unlawful purposes or activities;

- Uploading any content to the Service in violation of any applicable law, including but not limited to, intellectual property laws and publicity laws;

- Sending unsolicited promotions or advertisements;

- Accessing or tampering with the Service’s server systems;

- Interfering with or disrupting the access of any user, host, or network;

- Abusing or submitting excessively frequent requests to the Service via the API.

Candid Development, in its sole discretion, will determine abuse and/or misuse of our Service.`,
    header: "Using Our Service",
  },
  {
    content: `The fees for subscribing to Homechart are shown on our pricing page https://homechart.app/pricing ("Pricing"). All prices shown on Pricing are exclusive of all taxes, levies, or duties imposed by taxing authorities, and you shall be responsible for payment of all such taxes, levies, or duties, excluding only United States (federal or state) taxes. Where required, Candid Development will collect those taxes on behalf of taxing authority and remit those taxes to taxing authorities.

BY PURCHASING YOU EXPRESSLY UNDERSTAND AND AGREE TO OUR REFUND POLICY:

WITHIN SEVEN (7) DAYS OF YOUR SUBSCRIPTION PAYMENT DATE AS SHOWN ON YOUR PAYMENT BILL, YOU CAN REQUEST A FULL REFUND BY CONTACTING US. NO REFUND OF ANY KIND WILL BE PERMITTED AFTER SEVEN (7) DAYS OF YOUR SUBSCRIPTION PAYMENT DATE.`,
    header: "Subscription Service and Payment",
  },
  {
    content: `Subject to the terms and conditions of this Agreement and conditioned on subscribing to Homechart ("Software"), Candid Development hereby grants to you a non-exclusive, non-sublicensable and non-transferable, limited license to use the Software and Documentation.

You may install, use and run one copy of the Software. You may make one copy of the Software solely for testing, disaster recovery or archival purposes. Any copy of the Software that you make:

- Remains the exclusive property of Candid Development;

- Is subject to the terms and conditions of this Agreement.

You are allowed to use the Software with up to 2 Households.`,
    header: "Software License Agreement",
  },
  {
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS AVAILABLE “AS IS”. YOU EXPRESSLY UNDERSTAND AND AGREE THAT:

WHEN PERMITTED BY LAW, CANID DEVELOPMENT AND ITS SERVICE PARTNERS, LICENSORS, EMPLOYEES, AGENTS WILL NOT BE RESPONSIBLE FOR ANY LOST PROFITS, REVENUES, OR DATA, FINANCIAL LOSSES OR INDIRECT, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES UNDER ANY CIRCUMSTANCES.

YOUR USE AND/OR PURCHASE OF SERVICE ARE ALL AT YOUR SOLE RISK. THE SERVICE IS PROVIDED ON AN “AS IS” BASIS.

CANDID DEVELOPMENT DOES NOT WARRANT THAT:

- THE SERVICE WILL MEET ALL OF YOUR REQUIREMENTS AT ALL TIMES;

- THE SERVICE WILL BE ERROR-FREE AND ALL ERRORS IN THE SERVICE WILL BE CORRECTED;

- THE SERVICE WILL BE UNINTERRUPTED.

- ALL CONTENT DOWNLOADED, UPLOADED AND/OR OTHERWISE OBTAINED THROUGH THE USE OF THE SERVICE IS DONE AT YOUR OWN DISCRETION AND RISK AND YOU ARE SOLELY RESPONSIBLE FOR ANY DAMAGE TO YOUR COMPUTER EQUIPMENT OR DEVICES, INCLUDING BUT NOT LIMITED TO, LAPTOP COMPUTERS, DESKTOP COMPUTER, TABLETS, SMARTPHONES AND SMARTWATCHES, OR ANY DATA LOSS RESULTING FROM DOWNLOAD OR USE OF ANY SUCH ABOVE MENTIONED MATERIAL.`, // eslint-disable-line quotes
    header: "Limited Liability",
  },
  {
    content:
      "When registering for Homechart we ask for information such as your name and email address. Your information is only used internally and will not be shared with others.",
    header: "Information Gathering",
  },
];

export function AboutTermsOfService(): m.Component {
  return {
    oninit: (): void => {
      AppState.setLayoutApp({
        ...GetHelp(),
        breadcrumbs: [
          {
            name: "About",
          },
          {
            name: "Terms of Service",
          },
        ],
        toolbarActionButtons: [],
      });
    },
    view: (): m.Children => {
      return m(
        Form,
        {
          title: {
            name: "Homechart Terms of Service",
            subtitles: [
              {
                key: "Effective Date:",
                value: "2019-12-01",
              },
              {
                key: "Last Updated:",
                value: "2021-10-25",
              },
            ],
          },
        },
        tos.map((section) => {
          return m(FormItem, {
            name: section.header,
            textArea: {
              disabled: true,
              value: section.content,
            },
            tooltip: "",
          });
        }),
      );
    },
  };
}
