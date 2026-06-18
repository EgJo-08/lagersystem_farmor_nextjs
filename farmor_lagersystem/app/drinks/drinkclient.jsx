'use client'

import { useEffect, useMemo, useState } from "react"
import logout from "../action"

const RESET_KEY = "drinkTrackerLastReset";
const REMINDER_KEY = "drinkTrackerReminderDismissed";
const STORAGE_KEY = "drinkTracker"
const YEAR_MS = 1000 * 60 * 60 * 24 * 365;

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const exportBackup = () => {
  const data = localStorage.getItem(STORAGE_KEY) || "[]";

  const blob = new Blob([data], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `drink-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
};

const importBackup = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!confirm("Importing will replace all current data. Continue?")) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);

      if (!Array.isArray(imported)) {
        throw new Error("Invalid format");
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(imported)
      );

      window.location.reload();
    } catch {
      alert("Invalid backup file");
    }
  };

  reader.readAsText(file);
};



export default function DrinksPage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")

    if (Array.isArray(saved)) {
      setItems(
        saved.map((item) => ({
          id: makeId(),
          name: item.name || "",
          price: item.price || "",
          number: typeof item.number === "number" ? item.number : 0,
          history: Array.isArray(item.history) ? item.history : [],
          notes: Array.isArray(item.notes) ? item.notes : [],
          showHistory: false,
          action: null,
          inputValue: "",
          noteInput: "",
        }))
      )
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        items.map(({ name, price, number, history, notes }) => ({
          name,
          price,
          number,
          history,
          notes,
        }))
      )
    )
  }, [items, isLoaded])

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: makeId(),
        name: "",
        price: "",
        number: 0,
        history: [],
        notes: [],
        showHistory: false,
        action: null,
        inputValue: "",
        noteInput: "",
      },
    ])
  }

  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    console.log({
      month,
      day,
      year,
      reminder: localStorage.getItem(REMINDER_KEY),
    });
    if (
      month === 5 &&
      day >= 28 &&
      localStorage.getItem(REMINDER_KEY) !== String(year)
    ) {
      setShowReminder(true);
    }


    if (month === 5 && day >= 30) {
      const lastResetYear = localStorage.getItem(RESET_KEY);

      if (lastResetYear !== String(year)) {
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            history: [],
          }))
        );

        localStorage.setItem(RESET_KEY, String(year));
      }
    }
  }, [isLoaded]);
  const updateItem = (id, changes) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }

  const handleDelete = (id) => {
    if (
      confirm("Er du sikker på at du gerne vil slette den her?")
    ) {
      setItems((prev) =>
        prev.filter((item) => item.id !== id)
      );
    }
  };

  const handleAddNote = (id) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item

        const noteText = item.noteInput?.trim()
        if (!noteText) return item

        return {
          ...item,
          notes: [
            ...item.notes,
            {
              id: makeId(),
              text: noteText,
            },
          ],
          noteInput: "",
        }
      })
    )
  }

  const handleDeleteNote = (itemId, noteId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          notes: item.notes.filter((note) => note.id !== noteId),
        }
      })
    )
  }

  const handleAddOrRemove = (id, type, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item

        const numericValue = Number(value) || 0
        const nextNumber = type === "+" ? item.number + numericValue : item.number - numericValue
        const nextHistory = [
          ...item.history,
          {
            type,
            value: numericValue,
            time: Date.now(),
          },
        ].filter((entry) => Date.now() - entry.time < YEAR_MS)

        return {
          ...item,
          number: nextNumber,
          history: nextHistory,
          action: null,
          inputValue: "",
        }
      })
    )
  }
  const printHistory = () => {
    const html = `
<h1>Årsrapport ${new Date().getFullYear()}</h1>

${items
        .map(
          (item) => `
      <section style="margin-bottom: 30px;">
        <h2>${item.name}</h2>

        ${item.history.length
              ? item.history
                .map(
                  (entry) => `
                    <div>
                      ${entry.type}${entry.value}
                      -
                      ${new Date(entry.time).toLocaleString()}
                    </div>
                  `
                )
                .join("")
              : "<div>Ingen historik</div>"
            }
      </section>
    `
        )
        .join("")}
`;

    const win = window.open("", "_blank");

    win.document.write(`
    <html>
      <head>
        <title>Historik</title>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);

    win.document.close();
    win.print();
  };


  const printValue = () => {
    const html = `
<h1>Årsrapport ${new Date().getFullYear()}</h1>

${items
        .map(
          (item) => `
      <section style="margin-bottom: 30px;">
        <h2>${item.name}</h2>

        <p>Number:${item.number
            }</p>
        <p>enlig værdi: ${item.price}kr</p>
        <p>Total Værdi:${item.number * item.price}kr</p>
  
      </section>
    `
        )
        .join("")}
`;

    const win = window.open("", "_blank");

    win.document.write(`
    <html>
      <head>
        <title>Historik</title>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);

    win.document.close();
    win.print();
  };


  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return items
      .map((item) => ({
        ...item,
        history: item.history.filter((entry) => Date.now() - entry.time < YEAR_MS),
      }))
      .filter((item) => {
        if (!normalizedSearch) return true
        return item.name.toLowerCase().includes(normalizedSearch)
      })
  }, [items, search])

  return (
    <main id="drink_list">
      {showReminder && (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffe69c",
            padding: "12px",
            marginBottom: "16px",
            borderRadius: "8px",
          }}
        >
          <p>
            Husk at printe og gemme årsrapporten inden historikken nulstilles den 30 Juni.
          </p>

          <button
            type="button"
            onClick={() => {
              localStorage.setItem(
                REMINDER_KEY,
                String(new Date().getFullYear())
              );
              setShowReminder(false);
            }}
          >
            Luk
          </button>
        </div>
      )}
      <button id="knap" type="button" onClick={addItem}>
        tilføj en drik
      </button>
      <input
        className="search"
        type="text"
        placeholder="Søg efter navn"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {visibleItems.length === 0 ? (
        <p>Ingen drikkevarer endnu. Klik på knappen for at tilføje en drik.</p>
      ) : (
        visibleItems.map((item) => (
          <div key={item.id} className="items">
            <button type="button" className="deleteItem" onClick={() => handleDelete(item.id)}>
              x
            </button>

            <input
              className="navn"
              type="text"
              placeholder="navn"
              value={item.name}
              onChange={(event) => updateItem(item.id, { name: event.target.value })}
            />
            <input
              className="pris"
              type="text"
              placeholder="pris"
              value={item.price}
              onChange={(event) => updateItem(item.id, { price: event.target.value })}
            />


            <p>Number:{item.number}</p>
            <p>Pris totalt:{item.number * item.price}kr</p>

            <div>
              <button
                type="button"
                onClick={() => updateItem(item.id, { action: item.action === "add" ? null : "add", inputValue: "" })}
              >
                tilføj
              </button>
              <button
                type="button"
                onClick={() => updateItem(item.id, { action: item.action === "remove" ? null : "remove", inputValue: "" })}
              >
                fjern
              </button>
              <button type="button" onClick={() => updateItem(item.id, { showHistory: !item.showHistory })}>
                historik
              </button>
            </div>
            <div className="note-felt">
              <div className="note-input-row">
                <input
                  className="noteInput"
                  type="text"
                  placeholder="notater"
                  value={item.noteInput}
                  onChange={(event) => updateItem(item.id, { noteInput: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return
                    event.preventDefault()
                    handleAddNote(item.id)
                  }}
                />
                <button type="button" onClick={() => handleAddNote(item.id)}>
                  gem note
                </button>
              </div>

              {item.notes.length > 0 && (
                <div className="noteList">
                  {item.notes.map((note) => (
                    <div key={note.id} className="noteItem">
                      <span>{note.text}</span>
                      <button type="button" className="noteDeleteButton" onClick={() => handleDeleteNote(item.id, note.id)}>
                        slet
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {item.action && (
              <div>
                <input
                  type="number"
                  placeholder={item.action === "add" ? "tilføj" : "fjern"}
                  value={item.inputValue}
                  onChange={(event) => updateItem(item.id, { inputValue: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return
                    event.preventDefault()
                    handleAddOrRemove(item.id, item.action === "add" ? "+" : "-", item.inputValue)
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddOrRemove(item.id, item.action === "add" ? "+" : "-", item.inputValue)}
                >
                  gem
                </button>
              </div>
            )}

            {item.showHistory && (
              <div className="historyBox">
                {item.history.length === 0 ? (
                  <p>Ingen historik endnu.</p>
                ) : (
                  [...item.history]
                    .sort((a, b) => new Date(b.time) - new Date(a.time))
                    .map((entry, index) => (
                      <p key={index}>
                        {entry.type}
                        {entry.value} — {formatDate(entry.time)}
                      </p>
                    ))
                )}
              </div>
            )}
          </div>
        ))
      )}
      <form action={logout} className="logoutForm">
        <button type="submit" className="logoutButton">Log ud</button>
        <button type="button" onClick={printHistory}>
          Download historik PDF
        </button>
        <button type="button" onClick={printValue}>download beholdnings liste</button>
        <button type="button" onClick={exportBackup}>
          exporter information
        </button>
        <input
          type="file"
          accept=".json"
          onChange={importBackup}
        />
      </form>
    </main>
  )




}
