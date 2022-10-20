import { Options } from "next/dist/server/base-server"

export interface inputfield{
    id: string
    label: string
    icon?: string
    placeholder: string
}

export interface choices{
    id: string
    options: string[]  

}

