# /home/ubuntu/mvp_loja_mae_sefaz_service/main.py
import os
import base64
from flask import Flask, request, jsonify
from pynfe.processamento.nfe import ProcessarNFe
from pynfe.entidades.cliente import Cliente
from pynfe.entidades.emitente import Emitente
from pynfe.entidades.notafiscal import NotaFiscal
from pynfe.entidades.produto import Produto
from pynfe.entidades.tributo import TributoICMS, TributoPIS, TributoCOFINS, TributoIPI
from pynfe.entidades.pagamento import Pagamento
from pynfe.config import Config
from pynfe.utils.flags import UF_CODIGO
from pynfe.utils.danfe import GerarDanfe
import logging
import xml.etree.ElementTree as ET # For parsing XML responses

# For NFeDistribuicaoDFe, PyNFe might not have direct high-level support.
# We might need a SOAP client like zeep if direct calls are necessary.
# For now, let's assume we can construct the request or find a utility within PyNFe or related libs.

app = Flask(__name__)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

CNPJ_SOFTWARE_HOUSE = "00000000000000"
TOKEN_SOFTWARE_HOUSE = ""

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "SEFAZ Service is running"}), 200

@app.route("/api/nfe/generate-transmit", methods=["POST"])
def generate_transmit_nfe_route():
    logger.info("Received request to generate and transmit NFe.")
    payload = request.get_json()

    if not payload:
        logger.error("No JSON payload provided in request.")
        return jsonify({"error": "No JSON payload provided"}), 400

    cert_base64 = payload.get("certificate_base64")
    cert_pass = payload.get("certificate_password")
    emitente_details = payload.get("emitente")
    destinatario_details = payload.get("destinatario")
    produtos_details = payload.get("produtos", [])
    nf_info_details = payload.get("nota_fiscal_info")
    ambiente_nf = str(payload.get("ambiente", "2")) 
    last_used_nfe_number = payload.get("last_used_nfe_number") 
    current_nfe_series = payload.get("current_nfe_series")

    required_fields_check = {
        "certificate_base64": cert_base64,
        "certificate_password": cert_pass,
        "emitente": emitente_details,
        "destinatario": destinatario_details,
        "produtos": produtos_details,
        "nota_fiscal_info": nf_info_details,
        "last_used_nfe_number": last_used_nfe_number,
        "current_nfe_series": current_nfe_series
    }
    missing_fields = [field for field, value in required_fields_check.items() if value is None] 
    if missing_fields:
        logger.error(f"Missing required fields in payload: {missing_fields}")
        return jsonify({"error": f"Missing required fields: {", ".join(missing_fields)}"}), 400

    cert_path_temp = f"/tmp/temp_cert_{os.urandom(8).hex()}.pfx"
    try:
        with open(cert_path_temp, "wb") as f_cert:
            f_cert.write(base64.b64decode(cert_base64))
        logger.info(f"Temporary certificate saved to {cert_path_temp}")
    except Exception as e:
        logger.exception("Failed to decode and save temporary certificate.")
        return jsonify({"error": "Certificate handling error", "details": str(e)}), 500

    try:
        uf_emitente_sigla = emitente_details.get("uf_sigla", "SP").upper()
        uf_emitente_codigo = UF_CODIGO.get(uf_emitente_sigla)
        if not uf_emitente_codigo:
            logger.error(f"Invalid UF sigla for emitente: {uf_emitente_sigla}")
            if os.path.exists(cert_path_temp): os.remove(cert_path_temp)
            return jsonify({"error": f"UF inválida para emitente: {uf_emitente_sigla}"}), 400
        
        logger.info(f"Using environment: {"Homologação" if ambiente_nf == "2" else "Produção"} for UF: {uf_emitente_sigla} ({uf_emitente_codigo})")
        config = Config(
            cnpj_software_house=CNPJ_SOFTWARE_HOUSE,
            token_software_house=TOKEN_SOFTWARE_HOUSE,
            path_certificado=cert_path_temp,
            senha_certificado=cert_pass,
            uf=uf_emitente_codigo,
            ambiente=int(ambiente_nf),
        )
        logger.info("PyNFe Config object created.")
    except Exception as e:
        logger.exception("Failed to initialize PyNFe Config.")
        if os.path.exists(cert_path_temp): os.remove(cert_path_temp)
        return jsonify({"error": "PyNFe Configuration error", "details": str(e)}), 500

    try:
        logger.info("Mapping input data to PyNFe entities.")
        emit = Emitente(
            cnpj=emitente_details.get("cnpj"),
            nome_razao=emitente_details.get("nome_razao"),
            nome_fantasia=emitente_details.get("nome_fantasia", emitente_details.get("nome_razao")),
            logradouro=emitente_details.get("logradouro"),
            numero=emitente_details.get("numero"),
            complemento=emitente_details.get("complemento", ""),
            bairro=emitente_details.get("bairro"),
            municipio=emitente_details.get("municipio_nome"),
            codigo_municipio=emitente_details.get("municipio_codigo_ibge"),
            uf=uf_emitente_sigla,
            cep=emitente_details.get("cep"),
            pais_codigo="1058",
            pais_nome="BRASIL",
            telefone=emitente_details.get("telefone", ""),
            inscricao_estadual=emitente_details.get("inscricao_estadual"),
            regime_tributario=str(emitente_details.get("regime_tributario_codigo", "1"))
        )
        dest = Cliente(
            cpf_cnpj=destinatario_details.get("cpf_cnpj"),
            nome_razao=destinatario_details.get("nome_razao"),
            logradouro=destinatario_details.get("logradouro"),
            numero=destinatario_details.get("numero"),
            complemento=destinatario_details.get("complemento", ""),
            bairro=destinatario_details.get("bairro"),
            municipio=destinatario_details.get("municipio_nome"),
            codigo_municipio=destinatario_details.get("municipio_codigo_ibge"),
            uf=destinatario_details.get("uf_sigla", "").upper(),
            cep=destinatario_details.get("cep"),
            pais_codigo="1058",
            pais_nome="BRASIL",
            telefone=destinatario_details.get("telefone", ""),
            email=destinatario_details.get("email", ""),
            indicador_inscricao_estadual=str(destinatario_details.get("indicador_ie_codigo", "9"))
        )
        produtos_list_pynfe = []
        for i, prod_data in enumerate(produtos_details):
            icms_data = prod_data.get("tributos", {}).get("icms", {})
            pis_data = prod_data.get("tributos", {}).get("pis", {})
            cofins_data = prod_data.get("tributos", {}).get("cofins", {})
            trib_icms = TributoICMS(origem=str(icms_data.get("origem", "0")),
                                cst=str(icms_data.get("cst", "00")),
                                modalidade_base_calculo=str(icms_data.get("mod_bc", "3")),
                                valor_base_calculo=float(icms_data.get("valor_bc", 0.0)),
                                aliquota=float(icms_data.get("aliquota", 0.0)),
                                valor=float(icms_data.get("valor", 0.0)))
            trib_pis = TributoPIS(cst=str(pis_data.get("cst", "01")), valor_base_calculo=float(pis_data.get("valor_bc", 0.0)), aliquota=float(pis_data.get("aliquota_percentual", 0.0)), valor=float(pis_data.get("valor", 0.0)))
            trib_cofins = TributoCOFINS(cst=str(cofins_data.get("cst", "01")), valor_base_calculo=float(cofins_data.get("valor_bc", 0.0)), aliquota=float(cofins_data.get("aliquota_percentual", 0.0)), valor=float(cofins_data.get("valor", 0.0)))
            produto_pynfe = Produto(item=str(i + 1), codigo=prod_data.get("codigo_produto", f"PROD{i+1}"), descricao=prod_data.get("descricao"), ncm=prod_data.get("ncm"), cfop=str(prod_data.get("cfop")), unidade_comercial=prod_data.get("unidade_comercial", "UN"), quantidade_comercial=float(prod_data.get("quantidade")),
                                  valor_unitario_comercial=float(prod_data.get("valor_unitario")),
                                  unidade_tributavel=prod_data.get("unidade_tributavel", prod_data.get("unidade_comercial", "UN")),
                                  quantidade_tributavel=float(prod_data.get("quantidade_tributavel", prod_data.get("quantidade"))),
                                  valor_unitario_tributavel=float(prod_data.get("valor_unitario_tributavel", prod_data.get("valor_unitario"))),
                                  valor_total_bruto=float(prod_data.get("valor_total_bruto", float(prod_data.get("quantidade")) * float(prod_data.get("valor_unitario")) )),
                                  icms=trib_icms, pis=trib_pis, cofins=trib_cofins, informacoes_adicionais=prod_data.get("informacoes_adicionais_produto", ""))
            produtos_list_pynfe.append(produto_pynfe)
        pagamentos_list_pynfe = []
        for pag_data in nf_info_details.get("pagamentos", []):
            pagamento_pynfe = Pagamento(forma_pagamento=str(pag_data.get("forma_pagamento_codigo", "01")),
                                        valor_pagamento=float(pag_data.get("valor_pagamento")))
            pagamentos_list_pynfe.append(pagamento_pynfe)
        if not pagamentos_list_pynfe and produtos_list_pynfe:
            total_nf = sum(p.valor_total_bruto for p in produtos_list_pynfe)
            pagamentos_list_pynfe.append(Pagamento(forma_pagamento="01", valor_pagamento=total_nf))
        next_nfe_number = int(last_used_nfe_number) + 1
        nf = NotaFiscal(emitente=emit, destinatario=dest, produtos=produtos_list_pynfe, pagamentos=pagamentos_list_pynfe,
                        natureza_operacao=nf_info_details.get("natureza_operacao"),
                        modelo=str(nf_info_details.get("modelo_documento_fiscal", "55")),
                        serie=str(current_nfe_series),
                        numero_nf=str(next_nfe_number),
                        data_emissao=nf_info_details.get("data_emissao"),
                        finalidade_emissao=str(nf_info_details.get("finalidade_emissao_codigo", "1")),
                        tipo_operacao=str(nf_info_details.get("tipo_operacao_codigo", "1")),
                        forma_pagamento_nfe=str(nf_info_details.get("forma_pagamento_nf_codigo", "0")),
                        presenca_comprador=str(nf_info_details.get("presenca_comprador_codigo", "1")),
                        informacoes_adicionais_fisco=nf_info_details.get("informacoes_fisco", ""),
                        informacoes_complementares_contribuinte=nf_info_details.get("informacoes_contribuinte", ""))
        logger.info(f"NotaFiscal object created for NFe number: {nf.numero_nf}, Serie: {nf.serie}")
    except Exception as e:
        logger.exception("Error mapping input data to PyNFe entities.")
        if os.path.exists(cert_path_temp): os.remove(cert_path_temp)
        return jsonify({"error": "Data mapping error", "details": str(e)}), 400

    try:
        logger.info("Initializing ProcessarNFe.")
        processador = ProcessarNFe(configuracoes=config, nota_fiscal=nf)
        logger.info("ProcessarNFe initialized. Starting processing...")
        retorno_sefaz = processador.processar_nota()
        logger.info(f"SEFAZ processing completed. Raw response: {retorno_sefaz}")
        status_code = str(retorno_sefaz.get("cStat", ""))
        is_authorized = retorno_sefaz.get("bStat", False) and status_code == "100"
        if is_authorized:
            logger.info("NFe authorized successfully by SEFAZ.")
            xml_autorizado_str = processador.xml_autorizado.decode("utf-8") if processador.xml_autorizado else None
            danfe_pdf_base64 = None
            try:
                if processador.xml_autorizado:
                    logger.info("Attempting to generate DANFE PDF.")
                    gerador_danfe = GerarDanfe(xml=processador.xml_autorizado)
                    pdf_bytes = gerador_danfe.gerar_danfe()
                    danfe_pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
                    logger.info("DANFE PDF generated and base64 encoded.")
                else:
                    logger.warning("No authorized XML available to generate DANFE.")
            except Exception as danfe_exc:
                logger.exception("Error generating DANFE PDF.")
            response_data = {"status_sefaz": "autorizada", "codigo_status_sefaz": status_code, "motivo_sefaz": retorno_sefaz.get("xMotivo"),
                             "chave_acesso": retorno_sefaz.get("protNFe", {}).get("infProt", {}).get("chNFe") or retorno_sefaz.get("chNFe"),
                             "protocolo": retorno_sefaz.get("protNFe", {}).get("infProt", {}).get("nProt") or retorno_sefaz.get("nProt"),
                             "xml_autorizado": xml_autorizado_str, "danfe_pdf_base64": danfe_pdf_base64,
                             "numero_nf_emitido": nf.numero_nf}
            return jsonify(response_data), 200
        else:
            logger.warning(f"NFe not authorized or error occurred. SEFAZ response: {retorno_sefaz}")
            return jsonify({"status_sefaz": "rejeitada_ou_erro", "codigo_status_sefaz": status_code,
                            "motivo_sefaz": retorno_sefaz.get("xMotivo", "Unknown error from SEFAZ"),
                            "raw_response": retorno_sefaz}), 422
    except Exception as e:
        logger.exception("Exception during NFe processing (PyNFe interaction).")
        return jsonify({"error": "NFe processing error", "details": str(e)}), 500
    finally:
        if os.path.exists(cert_path_temp):
            try:
                os.remove(cert_path_temp)
                logger.info(f"Temporary certificate {cert_path_temp} removed.")
            except Exception as e_rm:
                logger.error(f"Error removing temporary certificate {cert_path_temp}: {e_rm}")

@app.route("/api/nfe/distribuicao-dfe", methods=["POST"])
def distribuicao_dfe_route():
    logger.info("Received request for NFeDistribuicaoDFe.")
    payload = request.get_json()

    if not payload:
        logger.error("No JSON payload provided for NFeDistribuicaoDFe.")
        return jsonify({"error": "No JSON payload provided"}), 400

    cert_base64 = payload.get("certificate_base64")
    cert_pass = payload.get("certificate_password")
    uf_sigla = payload.get("uf_sigla") # UF of the interested CNPJ (author of the query)
    cnpj_interessado = payload.get("cnpj_interessado")
    ambiente_nf = str(payload.get("ambiente", "1")) # AN uses "1" for production for this service
    ult_nsu = payload.get("ult_nsu", "0") # Last NSU received, or 0 to start

    required_fields_check = {
        "certificate_base64": cert_base64,
        "certificate_password": cert_pass,
        "uf_sigla": uf_sigla,
        "cnpj_interessado": cnpj_interessado
    }
    missing_fields = [field for field, value in required_fields_check.items() if not value]
    if missing_fields:
        logger.error(f"Missing required fields for NFeDistribuicaoDFe: {missing_fields}")
        return jsonify({"error": f"Missing required fields: {", ".join(missing_fields)}"}), 400

    cert_path_temp = f"/tmp/temp_cert_dist_{os.urandom(8).hex()}.pfx"
    try:
        with open(cert_path_temp, "wb") as f_cert:
            f_cert.write(base64.b64decode(cert_base64))
    except Exception as e:
        logger.exception("Failed to decode/save temp cert for NFeDistribuicaoDFe.")
        return jsonify({"error": "Certificate handling error", "details": str(e)}), 500

    try:
        uf_codigo = UF_CODIGO.get(uf_sigla.upper())
        if not uf_codigo:
            logger.error(f"Invalid UF sigla for NFeDistribuicaoDFe: {uf_sigla}")
            if os.path.exists(cert_path_temp): os.remove(cert_path_temp)
            return jsonify({"error": f"UF inválida: {uf_sigla}"}), 400

        # NFeDistribuicaoDFe typically uses Ambiente Nacional (AN), which might have specific config in PyNFe or require direct SOAP.
        # PyNFe's `Config` is usually per-state for emission. For AN services, it might differ.
        # For now, we'll try with the provided UF, but this might need adjustment for AN.
        # The MOC states that for DistribuicaoDFe, cUFAutor should be the code for AN (91 for Ambiente Nacional)
        # However, the `uf` parameter in PyNFe's Config is usually the UF of the *issuer* for state-level services.
        # Let's assume for now PyNFe handles AN if the service URL points to it.
        # We will use uf_codigo of the *author* of the request as per MOC for the <cUFAutor> in the SOAP body.
        # The actual service endpoint for NFeDistribuicaoDFe is national.

        config_dist = Config(
            cnpj_software_house=CNPJ_SOFTWARE_HOUSE, # May not be needed for this service
            token_software_house=TOKEN_SOFTWARE_HOUSE, # May not be needed
            path_certificado=cert_path_temp,
            senha_certificado=cert_pass,
            uf=uf_codigo, # This might be ignored if PyNFe uses a hardcoded AN endpoint for this type of service
            ambiente=int(ambiente_nf) # 1 = Produção, 2 = Homologação (MOC says AN is always prod-like)
        )
        logger.info(f"PyNFe Config for DistribuicaoDFe: UF {uf_sigla}, Ambiente {ambiente_nf}")

        # Placeholder for actual NFeDistribuicaoDFe call
        # PyNFe's high-level `ProcessarNFe` is for sending NFes, not querying distribution.
        # We would need to use a lower-level SOAP call or a specific PyNFe utility if it exists.
        # Example using a hypothetical `consultar_distribuicao_dfe` method:
        # from pynfe.servicos.distribuicao_dfe import NFeDistribuicaoDFe (this class might not exist)
        # servico = NFeDistribuicaoDFe(configuracoes=config_dist)
        # resultado = servico.consultar(cnpj=cnpj_interessado, ultimo_nsu=ult_nsu)

        # Since PyNFe might not directly support this, this is a MOCK RESPONSE:
        logger.warning("NFeDistribuicaoDFe actual SEFAZ call is NOT IMPLEMENTED. Returning mock data.")
        mock_docs = []
        if ult_nsu == "0": # Simulate first call
            mock_docs.append({
                "schema": "procNFe_v4.00.xsd", 
                "xml_base64": base64.b64encode(b"<xml_exemplo_nfe_compra1></xml_exemplo_nfe_compra1>").decode(),
                "nsu": "100000000000001"
            })
            mock_docs.append({
                "schema": "resEvento_v1.00.xsd", 
                "xml_base64": base64.b64encode(b"<xml_exemplo_evento_cancelamento1></xml_exemplo_evento_cancelamento1>").decode(),
                "nsu": "100000000000002"
            })
        
        response_data = {
            "status_sefaz": "sucesso", # cStat from SEFAZ (e.g., 138 for "Documento(s) localizado(s)")
            "motivo_sefaz": "Documento(s) localizado(s) - MOCK", # xMotivo
            "ult_nsu_recebido_pela_aplicacao": ult_nsu,
            "ult_nsu_sefaz": "100000000000005", # ultNSU from SEFAZ
            "max_nsu_sefaz": "100000000000002", # maxNSU from this batch
            "documentos": mock_docs, # list of {schema, xml_base64, nsu}
            "data_hora_consulta": datetime.now().isoformat()
        }
        return jsonify(response_data), 200

    except Exception as e:
        logger.exception("Exception during NFeDistribuicaoDFe processing.")
        return jsonify({"error": "NFeDistribuicaoDFe processing error", "details": str(e)}), 500
    finally:
        if os.path.exists(cert_path_temp):
            try: os.remove(cert_path_temp)
            except Exception as e_rm: logger.error(f"Error removing temp cert for DistribuicaoDFe: {e_rm}")

if __name__ == "__main__":
    from datetime import datetime # Add this import for the mock response
    host = os.environ.get("FLASK_RUN_HOST", "0.0.0.0")
    port = int(os.environ.get("FLASK_RUN_PORT", 5001))
    logger.info(f"Starting SEFAZ service for local development on {host}:{port}")
    app.run(host=host, port=port, debug=False)

