"use client"

import { LoginAction } from "./action"
import { useActionState } from "react"
import "./login.css"

const initialState = {
    values: {
        password: ""
    },
    errors: {}
}

export default function Home() {
    const [state, formAction, isPending] = useActionState(LoginAction, initialState)

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">Log ind</h1>

                <form action={formAction} className="login-form">
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Adgangskode:
                        </label>

                        <input
                            type="password"
                            name="password"
                            id="password"
                            className="form-input"
                            defaultValue={state.values.password}
                        />

                        {state.errors &&
                            "password" in state.errors &&
                            state.errors.password && (
                                <p className="error-message">
                                    {state.errors.password}
                                </p>
                            )}
                    </div>

                    {state.errors &&
                        "form" in state.errors &&
                        state.errors.form && (
                            <p className="error-message">
                                {state.errors.form[0]}
                            </p>
                        )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="submit-button"
                    >
                        {isPending ? "Logger ind..." : "Log ind"}
                    </button>
                </form>
            </div>
        </div>
    )
}