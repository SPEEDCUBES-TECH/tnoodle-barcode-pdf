import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
import {useState} from "react";

export default function App() {

  const [filePdfPrint, setFilePdfPrint] = useState(null);
  const [filePdfMobile, setFilePdfMobile] = useState(null);

  const [fileTxt, setFileTxt] = useState(null);
  const [fileTxtName, setFileTxtName] = useState(null);

  const [password, setPassword] = useState("");
  const [codeType, setCodeType] = useState("barcode");

  async function readFile(e) {
    e.preventDefault()
    const reader = new FileReader()
    reader.onload = async (e) => {
      setFileTxt(e.target.result)
    };
    reader.readAsText(e.target.files[0])

    setFileTxtName(e.target.files[0].name);
  }

  async function generate() {
    if (!fileTxt) return;

    setFilePdfMobile(null);
    setFilePdfPrint(null);

    const pdfData = await barcode.generate(fileTxt, {password, codeType});

    setFilePdfMobile(pdfData[0]);
    setFilePdfPrint(pdfData[1]);
  }

  function genRndPass() {
    setPassword(
      btoa(Math.random().toString())
        .replace(/[jiIl10ODQ8Bvu]/g, "")
        .substring(5, 15)
    )
  }

  function saveAs(content, extPrefix) {
    const el = document.createElement("a");
    const file = new Blob([content], {type: "application/pdf"});
    el.href = URL.createObjectURL(file);
    el.download = fileTxtName.replace(/.txt$|$/, `.${extPrefix}.pdf`);
    el.click();
  }

  return (<>
    <div className="container d-flex flex-column align-content-center justify-content-center">
      <div className="mb-3">
        <input className="form-control" type="file" accept="text/plain" onChange={readFile}/>
      </div>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="password"
          value={password}
          onInput={e => setPassword(e.target.value)}/>
        <button className="btn btn-outline-secondary btn-dice" type="button" onClick={genRndPass}>&nbsp;</button>
      </div>

      <div className="input-group mb-3">
        <div className="input-group-text user-select-none">code type</div>

        <input
          type="radio"
          className="btn-check"
          name="codeType"
          id="codeType-barcode"
          checked={codeType === "barcode"}
          onChange={() => setCodeType("barcode")}/>
        <label className="btn flex-grow-1 btn-outline-primary" htmlFor="codeType-barcode">barcode</label>

        <input
          type="radio"
          className="btn-check"
          name="codeType"
          id="codeType-qrcode"
          checked={codeType === "qrcode"}
          onChange={() => setCodeType("qrcode")}/>
        <label className="btn flex-grow-1 btn-outline-primary" htmlFor="codeType-qrcode">qr-code</label>

      </div>

      <button
        className={`btn btn-outline-${fileTxt ? "primary" : "secondary"}`}
        disabled={fileTxt === null}
        onClick={generate}>
        generate
      </button>
      <hr/>
      <div className="row">
        <div className="col d-flex">
          <button
            className={`btn flex-grow-1 btn-outline-${filePdfMobile ? "primary" : "secondary"}`}
            disabled={filePdfMobile === null}
            onClick={() => saveAs(filePdfMobile, "mobile")}>
            save mobile pdf
          </button>
        </div>
        <div className="col d-flex">
          <button
            className={`btn flex-grow-1 btn-outline-${filePdfPrint ? "primary" : "secondary"}`}
            disabled={filePdfPrint === null}
            onClick={() => saveAs(filePdfPrint, "print")}>
            save print pdf
          </button>
        </div>
      </div>
    </div>
    <div className="container footer">
      <div className="row">
        <div className="col mb-3 d-flex justify-content-between font-monospace">
          <a href="https://idleness.ru?f=tnoodle-barcode-pdf" target="_blank" style={{opacity: 0}}> Idleness.ru </a>
          <a href="https://github.com/SPEEDCUBES-TECH/tnoodle-barcode-pdf" target="_blank"
             className="text-secondary text-opacity-50">GitHub</a>
        </div>
      </div>
    </div>
  </>);
}
