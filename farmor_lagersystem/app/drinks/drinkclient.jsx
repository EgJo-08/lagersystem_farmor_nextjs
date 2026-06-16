'use client'

import { useEffect, useMemo, useState } from "react"
import { redirect } from "next/navigation";
import logout from "../action"


const STORAGE_KEY = "drinkTracker"
const WEEK_MS = 1000 * 60 * 60 * 24 * 7

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

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
          showHistory: false,
          action: null,
          inputValue: "",
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
        items.map(({ name, price, number, history }) => ({
          name,
          price,
          number,
          history,
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
        showHistory: false,
        action: null,
        inputValue: "",
      },
    ])
  }

  const updateItem = (id, changes) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }

  const handleDelete = (id) => {
    const confirmed = true
    if (confirmed) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
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
        ].filter((entry) => Date.now() - entry.time < WEEK_MS)

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

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return items
      .map((item) => ({
        ...item,
        history: item.history.filter((entry) => Date.now() - entry.time < WEEK_MS),
      }))
      .filter((item) => {
        if (!normalizedSearch) return true
        return item.name.toLowerCase().includes(normalizedSearch)
      })
  }, [items, search])

  return (
    <main id="drink_list">
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
                  item.history.map((entry, index) => (
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
      </form>
    </main>
  )
}
