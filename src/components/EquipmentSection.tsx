import { ArrowUpRight, Check, PlugZap } from "lucide-react";
import type { Lang } from "../config/business";
import { pricing } from "../config/pricing";
import { business } from "../config/business";
import {
  equipmentIds,
  equipmentPhotos,
  equipmentMatrix,
} from "../config/equipment";
import { equipmentCopy } from "../i18n/equipment";
import { Container, MotionReveal } from "./UI";
export function EquipmentSection({
  lang,
  garage,
}: {
  lang: Lang;
  garage: string;
}) {
  const t = equipmentCopy[lang];
  const symbols = { included: "✓", scope: "•", extra: "+", none: "—" };
  return (
    <section id="equipment" className="equipment-section section">
      <Container>
        <div className="section-heading">
          <span className="eyebrow">{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.intro}</p>
        </div>
        <div className="equipment-editorial">
          {t.items.map((item, i) => {
            const photo = equipmentPhotos[equipmentIds[i]];
            return (
              <MotionReveal
                key={item.name}
                className={`equipment-story equipment-${equipmentIds[i]} ${photo ? "with-photo" : ""}`}
              >
                <div className="equipment-name">
                  <span className="eyebrow">
                    0{i + 1} / {item.category}
                  </span>
                  <h3>{item.name}</h3>
                  {photo && (
                    <figure>
                      <img
                        src={photo.src}
                        alt={`${t.photoLabel}: ${item.name}`}
                        width={photo.width}
                        height={photo.height}
                        loading="lazy"
                      />
                      <figcaption>{photo.credit}</figcaption>
                    </figure>
                  )}
                </div>
                <div className="equipment-explanation">
                  <h4>{item.lead}</h4>
                  <p>{item.text}</p>
                  <p className="equipment-benefit">
                    <ArrowUpRight size={18} />
                    {item.benefit}
                  </p>
                  <small>{item.scope}</small>
                </div>
              </MotionReveal>
            );
          })}
        </div>
        <div className="power-feature">
          <div>
            <span className="eyebrow">{t.powerCategory}</span>
            <h3>{t.powerTitle}</h3>
            <p>{t.powerText}</p>
            <p>{t.powerGarage}</p>
            <small>{garage}</small>
            <dl className="power-fees">
              {business.packages.map((p) => (
                <div key={p.id}>
                  <dt>{p.name}</dt>
                  <dd>
                    {pricing.power[p.id]
                      ? `+${pricing.power[p.id]} zł`
                      : t.legend.included}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="power-statements">
            {equipmentPhotos.power ? (
              <img
                src={equipmentPhotos.power.src}
                alt="EcoFlow Delta 3"
                width={equipmentPhotos.power.width}
                height={equipmentPhotos.power.height}
                loading="lazy"
              />
            ) : (
              <PlugZap size={48} strokeWidth={1.2} />
            )}
            <ul>
              {t.powerLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <span>
              <Check size={17} />
              {t.powerScope}
            </span>
          </div>
        </div>
        <div className="equipment-comparison">
          <h3>{t.tableTitle}</h3>
          <p>{t.tableIntro}</p>
          <div
            className="table-scroll"
            role="region"
            aria-label={t.packageLabel}
            tabIndex={0}
          >
            <table>
              <caption className="sr-only">{t.tableTitle}</caption>
              <thead>
                <tr>
                  <th scope="col">{t.title}</th>
                  {business.packages.map((p) => (
                    <th scope="col" key={p.id}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.map((name, i) => (
                  <tr key={name}>
                    <th scope="row">{name}</th>
                    {equipmentMatrix[i].map((state, k) => (
                      <td key={k}>
                        {i === 5 ? (
                          pricing.power[business.packages[k].id] ? (
                            `+${pricing.power[business.packages[k].id]} zł`
                          ) : (
                            t.legend.included
                          )
                        ) : (
                          <>
                            <span aria-hidden="true">{symbols[state]}</span>
                            <span className="sr-only">{t.legend[state]}</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-legend">
            {Object.entries(t.legend).map(([key, text]) => (
              <span key={key}>
                <b>{symbols[key as keyof typeof symbols]}</b> {text}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
