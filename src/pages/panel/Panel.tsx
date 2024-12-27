import { FormEvent, useEffect, useRef, useState } from "react";
import {
  anki,
  canAnkiConnect,
  fileDataFrom,
  fileNameFrom,
  getDecks,
  MODEL_NAME,
} from "./connect";
import localforage from "localforage";
import Browser from "webextension-polyfill";

const Input = ({
  id,
  input,
  setInput,
  label,
  ...args
}: {
  id: string;
  input: string;
  setInput: (i: string) => void;
  label: string;
} & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) => {
  useEffect(() => {
    localforage.getItem(id).then((value) => {
      if (value && !input) setInput(value as string);
    });
  }, [id]);

  return (
    <div className="mb-3">
      <label
        htmlFor={id}
        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
      >
        {label}
      </label>
      <input
        type="text"
        id={id}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        {...args}
        value={input}
        onChange={(e) => {
          localforage.setItem(id, e.target.value);
          setInput(e.target.value);
        }}
      />
    </div>
  );
};

export default function Panel() {
  const [ankiConnect, setAnkiConnect] = useState<boolean | undefined>();
  const [decks, setDecks] = useState<string[]>([]);
  const [deck, setDeck] = useState("Default");
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [error, setError] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | undefined>();
  const submitButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    canAnkiConnect().then((connect) => setAnkiConnect(connect));
    localforage.getItem("image").then((value) => {
      if (value) setImage(value as string);
    });
    getDecks()
      .then((x) => {
        const decks = Object.keys(x);
        setDecks(decks);
        localforage.getItem("cache-deck").then((value) => {
          if (value && decks.includes(value as string))
            setDeck(value as string);
        });
      })
      .catch(console.error);

    const onMessage = async (message: unknown) => {
      const msg = message as {
        type: "image";
        image: string;
      };

      if (msg && typeof msg === "object" && msg.type === "image") {
        setImage(msg.image);
        localforage.setItem("image", msg.image);
      }
    };

    Browser.runtime.onMessage.addListener(onMessage);

    return () => {
      Browser.runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  const clearForm = async () => {
    setFrontText("");
    setBackText("");
    setImage(undefined);
    (await localforage.keys())
      .filter((k) => !k.startsWith("cache-"))
      .forEach((k) => localforage.removeItem(k));
  };

  const submitForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!frontText) return setError("Front Text is required");
    if (!backText && !image) return setError("Must have Back Text or an Image");

    anki("addNote", {
      note: {
        deckName: deck,
        modelName: MODEL_NAME,
        fields: {
          "Front Text": frontText,
          "Back Text": backText,
        },
        options: {
          allowDuplicate: false,
          duplicateScope: "deck",
          duplicateScopeOptions: {
            deckName: deck,
            checkChildren: false,
            checkAllModels: false,
          },
        },
        tags: [
          "anki-lingual",
          ...(backText ? ["with-back-text"] : []),
          ...(image ? ["with-image"] : []),
        ],
        picture: image
          ? [
              {
                data: fileDataFrom(image),
                filename: fileNameFrom(image),
                fields: ["Image"],
              },
            ]
          : undefined,
      },
    })
      .then(() => {
        clearForm();
        try {
          submitButton.current?.classList.add("bg-green-500");
          setTimeout(() => {
            submitButton.current?.classList.remove("bg-green-500");
          }, 600);
        } catch (e) {}
      })
      .catch((e: Error) => {
        console.error(e);
        if (e.message.includes("duplicate")) {
          setError("This card already exists");
        } else {
          setError("Failed to add note");
        }
      });
  };

  if (typeof ankiConnect === "undefined")
    return (
      <div className="absolute top-0 left-0 right-0 bottom-0 text-center h-full p-3 bg-gray-800">
        <header className="flex flex-col items-center justify-center text-white h-full">
          <svg
            className="animate-spin h-12 w-12 fill-white"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
          </svg>
          <h1 className="text-lg mb-2">Loading...</h1>
          <div>Checking if Anki is running.</div>
        </header>
      </div>
    );

  if (ankiConnect === false) {
    return (
      <div className="absolute top-0 left-0 right-0 bottom-0 text-center h-full p-3 bg-gray-800">
        <header className="flex flex-col items-center justify-center text-white h-full">
          <h1 className="text-lg mb-3">
            One more step!{" "}
            <span role="img" aria-label="pointing up">
              ☝️
            </span>
          </h1>
          <div>
            Add the{" "}
            <a
              href="https://ankiweb.net/shared/info/2055492159"
              target="_blank"
              className="underline text-gray-200"
            >
              Anki Connect
            </a>{" "}
            extension. You can go to Tools &gt; Add-ons &gt; Get Add-on and type
            in 2055492159.
          </div>
          <div className="my-3">Also! Make sure Anki is running.</div>
          <button
            className="bg-blue-500 text-white rounded-lg p-2.5 mt-3 w-full outline-none border-none"
            onClick={() => window.location.reload()}
          >
            Connect Again
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 h-full p-3 bg-gray-100">
      <form onSubmit={submitForm}>
        {error && (
          <div className="mb-3">
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <svg
                  onClick={() => setError("")}
                  className="fill-current h-6 w-6 text-red-500"
                  role="button"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 6.91L17.09 4L12 9.09L6.91 4L4 6.91L9.09 12L4 17.09L6.91 20L12 14.91L17.09 20L20 17.09L14.91 12L20 6.91Z" />
                  <title>Close</title>
                </svg>
              </span>
            </div>
          </div>
        )}

        <div className="mb-3">
          <label
            htmlFor="deck"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Deck
          </label>
          <select
            id="deck"
            onChange={(e) => {
              setDeck(e.target.value);
              localforage.setItem("cache-deck", e.target.value);
            }}
            value={deck}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            {decks.map((deck) => (
              <option key={deck} value={deck}>
                {deck}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="frontText"
          type="text"
          placeholder="la palabra"
          required
          label="Front Text"
          input={frontText}
          setInput={setFrontText}
        />

        <Input
          id="backText"
          type="text"
          placeholder="the word"
          label="Back Text (optional)"
          input={backText}
          setInput={setBackText}
        />

        <div className="flex items-center justify-center mt-3">
          <button
            type="button"
            className="p-2.5 w-full outline-none bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded-lg"
            onClick={() => imageInput.current?.click()}
          >
            Select Image
          </button>
          {image && (
            <div className="h-fit pl-2">
              <img src={image} className="max-h-10 max-w-[5rem]" />
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-2">
          You can also add an image by right-clicking an image and selecting
          AnkiLingual &gt; Add Image.
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={(r) => {
            imageInput.current = r;
          }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const imgDataUrl = (e.target?.result ?? undefined) as
                  | string
                  | undefined;
                setImage(imgDataUrl);
                localforage.setItem("image", imgDataUrl);
              };
              reader.readAsDataURL(e.target.files[0]);
            }
          }}
        />

        <button
          type="submit"
          className="bg-blue-500 text-white rounded-lg p-2.5 mt-3 w-full outline-none border-none transition-all duration-500 ease-in-out"
          ref={(r) => {
            submitButton.current = r;
          }}
        >
          Create Card
        </button>
        <button
          type="button"
          className="p-2.5 w-full outline-none bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded-lg mt-2"
          onClick={clearForm}
        >
          Clear
        </button>
      </form>
    </div>
  );
}
