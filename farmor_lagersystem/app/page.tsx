"use client"

import { LoginAction } from "./action"
import { useActionState } from "react"

const initialState = {
    values: {
        password: ""
    },
    errors: {}
}

export default function Home() {
  const [state, formAction, isPending] = useActionState(LoginAction, initialState)
    return(
        <>
        <h1>log ind</h1>

        <form action={formAction}>
            <div>
                <label htmlFor="password">Adganskode:</label>
                <input type="password" name="password" id="password" defaultValue={state.values.password} />
                {state.errors && "password" in state.errors && state.errors.password && (
                    <p>{state.errors.password}</p>
                )}
            </div>
            {state.errors && "form" in state.errors && state.errors.form && (
                <p>{state.errors.form[0]}</p>
            )}
            <button type="submit" disabled={isPending}>{isPending ? "Logger ind..." : "Log ind"}</button>
        </form>
        </>
    )
}
