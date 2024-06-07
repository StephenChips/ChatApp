import style from "./AccountInfo.module.css"

console.log(style)

export function AccountInfo() {
  return (
    <div className={style.container}>
      <div>
        <img src="https://fastly.picsum.photos/id/523/200/200.jpg?hmac=d1qFeOBBhPqpCZ0U-197Ibo1qK82CmzUfDfKVS70O24"></img>
      </div>
      <div style={{ lineHeight: 1.3, fontSize: "14px" }}>
        <span>#1234</span><br />
        <span style={{ fontSize: "26px" }}>John Wick</span><br />
        <a href="">Setting</a>
        &nbsp;&nbsp;
        <a href="">Logout</a>
      </div>
    </div>
  )
}