import { toast } from "react-hot-toast"

export const showAlert = (message, type = "info") => {
  if (type === "error") toast.error(message)
  else if (type === "success") toast.success(message)
  else toast(message)
}