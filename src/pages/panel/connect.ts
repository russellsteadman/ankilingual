import { Action, APIParams, APIResponse } from "./connect-types";
import { v5 as uuid } from "uuid";

export const anki = <T extends Action>(
  action: T,
  params: APIParams<T>
): Promise<APIResponse<T>> => {
  return fetch("http://127.0.0.1:8765/", {
    method: "POST",
    body: JSON.stringify({ action, version: 6, params }),
    signal: AbortSignal.timeout(action === "addNote" ? 5000 : 500),
  })
    .then((r) => r.json())
    .then((x) => {
      if (x.error) throw new Error(x.error);

      return x.result;
    });
};

const css = (strings: TemplateStringsArray) => strings.join("");

export const MODEL_NAME = "AnkiLingual";
export const ensureModelExists = async () => {
  return anki("findModelsByName", { modelNames: [MODEL_NAME] }).catch((e) =>
    anki("createModel", {
      modelName: MODEL_NAME,
      inOrderFields: ["Front Text", "Back Text", "Image"],
      css: css`
        .card {
          font-family: system-ui, -apple-system, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif,
            "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
            "Noto Color Emoji";
          font-size: max(1.3rem, 4vh);
          text-align: center;
          padding: 1rem;
          color: #333;
          background-color: #fff;
          display: block;
        }
        .back .front-text {
          margin-bottom: 1rem;
        }
        img {
          max-height: min(50vh, 480px);
          width: auto;
          max-width: 100%;
          margin-top: 1rem;
        }
      `,
      isCloze: false,
      cardTemplates: [
        {
          Name: "Default",
          Front: '<div class="front front-text">{{Front Text}}</div>',
          Back: '<div class="back"><div class="front-text">{{Front Text}}</div><hr><div class="back-text">{{Back Text}}</div>{{Image}}</div>',
        },
      ],
    })
  );
};

export const canAnkiConnect = async () => {
  return ensureModelExists()
    .then((x) => true)
    .catch((e) => {
      console.error(e);
      return false;
    });
};

export const getDecks = async () => {
  return anki("deckNamesAndIds", {});
};

export const fileNameFrom = (dataUri: string) => {
  const fileId = uuid(dataUri, uuid.URL);
  const mimeType = dataUri.split(";")[0].split(",")[0].split(":")[1] ?? "";
  return `${fileId}.${mimeType.split("/")[1].split("+")[0]}`;
};

export const fileDataFrom = (dataUri: string) => {
  return dataUri.split(",").pop() ?? "";
};
