import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DrinksClient from "../drinks/drinkclient"


export default async function DrinksPage() {
    const cookieStore = await cookies()

    if (!cookieStore.get("token")) {
        redirect("/")
    }

    return <DrinksClient />
}