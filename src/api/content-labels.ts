import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A content classification label: a warning a broadcaster can put on a stream. */
export interface ContentLabel {
  /** ID of the label, such as `"Gambling"`. */
  id: string;
  /** What the label covers, in the requested language. */
  description: string;
  /** Name of the label, in the requested language. */
  name: string;
}

/** The languages the labels are translated into. */
export type ContentLabelLocale =
  | "bg-BG"
  | "cs-CZ"
  | "da-DK"
  | "de-DE"
  | "el-GR"
  | "en-GB"
  | "en-US"
  | "es-ES"
  | "es-MX"
  | "fi-FI"
  | "fr-FR"
  | "hu-HU"
  | "it-IT"
  | "ja-JP"
  | "ko-KR"
  | "nl-NL"
  | "no-NO"
  | "pl-PL"
  | "pt-BR"
  | "pt-PT"
  | "ro-RO"
  | "ru-RU"
  | "sk-SK"
  | "sv-SE"
  | "th-TH"
  | "tr-TR"
  | "vi-VN"
  | "zh-CN"
  | "zh-TW";

/** Parameters of {@link ContentLabelsApi.list}. */
export interface GetContentLabelsParams {
  /** Language of the names and descriptions. Twitch defaults to `"en-US"`. */
  locale?: ContentLabelLocale;
}

/** Content classification labels and their localized names. */
export class ContentLabelsApi extends ApiGroup {
  /**
   * Lists every content classification label, with its name and description
   * in the language you ask for.
   *
   * Token: app or user.
   *
   * @example
   * const labels = await twitch.contentLabels.list({ locale: "fr-FR" });
   * @see https://dev.twitch.tv/docs/api/reference/#get-content-classification-labels
   */
  list(params: GetContentLabelsParams = {}, options?: RequestOptions): Promise<ContentLabel[]> {
    return this.rest.data<ContentLabel>({ path: "content_classification_labels", query: params, options });
  }
}
