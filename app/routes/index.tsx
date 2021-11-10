import {
  MetaFunction,
  LoaderFunction,
  ActionFunction,
  useLoaderData,
  RouteComponent,
  json,
  redirect,
  Form,
  useSubmit,
  Link,
} from "remix";

import { prisma } from "~/prisma.server";

import { CertificateWithArtist } from "~/types";

type RouteData = {
  certificates: CertificateWithArtist[];

  sort: string;

  pager: {
    skip: number;
    take: number;
    total: number;
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  const { searchParams } = new URL(request.url);

  const sort = searchParams.get("sort") === "desc" ? "desc" : "asc";
  const skip = Number(searchParams.get("skip") || 0);
  const take = Number(searchParams.get("take") || 6);

  const certificates = await prisma.certificate.findMany({
    include: {
      artist: true,
    },

    orderBy: {
      artist: {
        lastName: sort,
      },
    },

    skip,
    take,
  });

  const total = await prisma.certificate.count();

  return json({
    certificates,

    sort,

    pager: {
      skip,
      take,
      total,
    },
  });
};

export const meta: MetaFunction = ({ data }: { data: RouteData }) => {
  return {
    title: "Verisart",
    description: `We've got ${data?.certificates.length} for ya`,
  };
};

export const action: ActionFunction = async ({ request }) => {
  const body = new URLSearchParams(await request.text());

  switch (request.method.toLowerCase()) {
    case "delete":
      await prisma.artist.delete({
        where: {
          certificateId: Number(body.get("id")),
        },
      });

      await prisma.certificate.delete({
        where: {
          id: Number(body.get("id")),
        },
      });

      return redirect("/");
  }
};

const IndexRoute: RouteComponent = () => {
  const { certificates, sort, pager } = useLoaderData<RouteData>();

  const submit = useSubmit();

  function handleSortChange(event: any) {
    const searchParams = new URLSearchParams(window.location.search);

    searchParams.append("sort", event.target.value);

    submit(searchParams, {
      action: "/",
      method: "get",
    });
  }

  function handleDeleteSubmit(event: any) {
    event.preventDefault();

    if (confirm("Are you sure?")) {
      submit(event.currentTarget, { method: "delete" });
    }
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-between mb-4 pb-4 border-b space-y-4 sm:flex-row sm:space-y-0">
        <Form onChange={handleSortChange}>
          <select
            name="sort"
            className="select select-bordered w-full max-w-xs"
            defaultValue={sort}
          >
            <option value="asc">Sort by Artist | Ascending</option>
            <option value="desc">Sort by Artist | Descending</option>
          </select>
        </Form>

        <Link to="/new" className="btn btn-primary">
          New Certificate
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {certificates.map((certificate) => (
          <div key={certificate.id} className="card image-full h-80 shadow-xl">
            <figure>
              <img src="https://picsum.photos/id/1005/400/250" />
            </figure>

            <div className="card-body justify-end">
              <h2 className="card-title">
                {certificate.title} by {certificate.artist.firstName}{" "}
                {certificate.artist.lastName}
              </h2>

              <div className="badge badge-ghost">
                <svg
                  viewBox="0 0 64 64"
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline-block mr-1 w-4 h-4 stroke-current"
                >
                  <path
                    d="M2.774 61c-1.084 0-1.76-.452-2.138-.83-1.158-1.158-.57-2.79.46-5.15.426-.976 4.76-10.173 8.778-18.536 8.533-17.755 8.92-17.987 9.623-18.41.384-.23.836-.347 1.347-.347h.006l.05-.167c-1.4-.08-3.093-.77-3.942-2.203-.766-1.296-.81-3.054-.112-4.482.457-.932 1.656-2.55 4.555-2.91.29-.035.565-.052.828-.052 3.396 0 5.506 2.702 5.506 7.05 0 1.707-.632 3.65-1.47 4.81.405.237.82.495 1.244.776.275-.825.745-2.122 1.55-4.22 1.185-3.087 1.746-4.424 2.12-5.077-.923-.878-1.452-2.183-1.386-3.52.09-1.84 1.234-3.428 3.137-4.356a3.725 3.725 0 0 1 1.648-.377c1.374 0 2.74.718 3.653 1.922.89 1.172 1.19 2.608.82 3.94a4.84 4.84 0 0 1-3.12 3.313c.018.112.027.228.027.348 0 .38 0 .607-1.987 5.978-1.154 3.12-1.723 4.657-2.18 5.445a35.89 35.89 0 0 1 1.667 1.667c.905-2.012 3.854-6.404 7.712-9.255 2.96-2.188 5.58-3.297 7.787-3.297 1.864 0 3 .79 3.628 1.45 2.01 2.122 1.995 6.23-.03 8.79-.303.385-.642.73-1.006 1.033.788-.126 1.454-.19 1.993-.19.746 0 1.313.122 1.767.382a4.278 4.278 0 0 1 2.584-2.07c.564-.158 1.183-.304 1.872-.304 1.562 0 2.84.752 3.698 2.173.61 1.01.704 2.153.263 3.214-.64 1.537-2.297 2.567-3.566 2.873a4.138 4.138 0 0 1-.97.115c-1.322 0-2.623-.643-3.488-1.684-.28.197-.606.327-.962.37-.067.01-.234.02-.49.022-1.545.01-3.005.188-4.365.528 3.25.21 5.17 2.23 5.17 5.5 0 2.684-2.08 5.613-5.44 5.664h-.11c-3.19 0-4.923-2.204-5.09-3.694a2.024 2.024 0 0 1-.01-.126c-.543.385-.904.64-1.32.79a2.5 2.5 0 0 1-.834.14c-.116 0-.232-.007-.347-.022 1.623 3.383 1.97 5.785 1.027 7.18-.558.825-1 1.478-34.558 14.074-1.507.565-2.485.932-2.695 1.016-1.27.504-2.14.718-2.903.718zM36.63 29.498a85.249 85.249 0 0 1 2.79 4.12c.23-.283.523-.56.866-.83a2.23 2.23 0 0 1-.922-.945c-.403-.784-.324-1.768.203-2.507.536-.752 3.468-2.612 6.9-3.773a3.218 3.218 0 0 1-.462-.19c-.893-.446-1.964-1.39-2.3-2.695a3.257 3.257 0 0 1-.1-.978c-.36.342-.71.716-1.045 1.12-1.512 1.837-2.49 3.224-3.206 4.237-.405.574-.725 1.027-1.015 1.378-.462.56-1.055.926-1.71 1.063z"
                    fill="#FFF"
                  />

                  <path d="M30.083 22.91c.218-.037 3.892-10.096 3.892-10.387 0-.292-.69-.583-1.02-.364-.326.218-3.855 9.474-3.855 9.984 0 .546.765.8.983.765zm2.802-12.83c1.42.876 3.71.22 4.256-1.748.547-1.968-1.722-3.962-3.346-3.17-2.765 1.348-2.328 4.044-.91 4.92zm1.527-3.716c.824-.11 2.11.656 1.637 1.93-.474 1.276-1.602 1.532-2.51.985-.91-.547-1.02-2.66.872-2.916zm2.4 20.808c.692-.838 1.82-2.697 4.22-5.612 2.402-2.915 5.822-4.628 7.204-4.7 1.382-.074 1.82.837 1.82 2.04s-1.602 3.025-1.856 2.915c-.255-.11-.146-.51-.327-.984-.182-.473-1.31-.8-2.037.256-.728 1.057.255 2.114 1.055 2.515.8.402 2.73.22 4.112-1.53 1.382-1.75 1.49-4.774.146-6.195-1.346-1.42-4.365-1.203-8.804 2.077-4.438 3.28-7.174 8.42-7.203 8.71-.073.73.982 1.35 1.673.51zM61.77 25.35c-.947-1.567-2.306-1.274-3.348-.984-1.31.364-2 1.895-1.455 2.843.546.947 1.673 1.53 2.728 1.274 1.055-.255 3.02-1.567 2.074-3.134zm-1.566 1.968c-1.09.692-2.292.036-2.292-.838 0-.875.728-1.42 1.637-1.24.606.122 1.746 1.386.654 2.078zm-11.677 4.446c-4.147.364-7.64 2.764-7.676 3.207-.035.438 1.056 1.24 1.565 1.058.51-.182 2.292-1.822 4.402-2.515 2.11-.692 3.674-.328 4.22 1.057.546 1.385-.218 2.624-1.382 2.624s-1.6-.984-1.782-1.13c-.182-.146-1.528.62-1.492.948.037.328.8 1.968 3.202 1.93 2.4-.035 3.492-2.295 3.492-3.68 0-1.384-.4-3.862-4.547-3.498zM21.825 15.438c.473-.364.51-.984.327-1.24-.182-.254-1.018-.218-1.49-.436-.474-.22-.438-1.822.508-2.04.946-.22 1.746-.11 2.22 2.04.472 2.15-.62 4.446-.62 4.446-.217.73 1.31.875 1.638.692.327-.182 1.346-1.968 1.346-3.936s-.582-5.466-4.11-5.03c-3.53.438-3.675 3.244-2.984 4.41.692 1.167 2.693 1.46 3.165 1.094zm-1.31 4.337c-.908.546-16.842 34.292-17.606 36.04-.765 1.75-1.07 2.757-.874 2.953.473.474 1.528.22 2.91-.328 1.382-.547 35.578-13.23 36.342-14.358.764-1.13-.437-5.357-6.44-13.666s-13.423-11.188-14.332-10.64zm-9.094 34.438c-.4.474-1.818.947-1.854.838-.036-.108.4-1.53.255-1.64-.145-.108-.727-.072-.872.11-.145.182-.437 1.86-.473 1.968-.036.11-.69.364-.728.255-.036-.11.546-2.114.4-2.223-.145-.11-.837-.036-.91.182-.072.22-.217 2.223-.4 2.332-.18.11-1.927.692-2.254.474-.212-.142 3.93-8.054 4.147-8.054.218 0 1.71.838 2.22 2.442.508 1.604.872 2.843.47 3.317zm7.313-2.88c-.11.11-2.146.73-2.146.73s.69-2.04.546-2.15c-.146-.11-1.02-.11-1.055.073-.036.182-.546 2.37-.582 2.478-.036.11-.618.328-.618.22 0-.11.873-2.516.728-2.625-.145-.11-.982.108-.982.29s-.8 2.734-.873 2.88c-.072.146-1.163.802-1.236.547-.073-.255.255-1.93-.91-3.863-1.163-1.93-2.327-2.442-2.473-2.587-.256-.258 4.912-9.62 5.13-9.62.218 0 3.747 2.44 4.33 7.105.58 4.663.253 6.412.143 6.522zm6.367-2.696c-.218.146-1.382.51-1.382.51s.4-1.86.327-1.968c-.073-.11-.946.218-1.02.327-.072.11-.072 1.822-.326 2.004-.256.183-.583.293-.583.293l.364-2.842s-.98.22-.98.33c0 .108-.147 2.66-.328 2.842s-1.31.73-1.382.62c-.073-.11.764-5.03-.91-8.673-1.672-3.645-2.8-4.556-4.255-5.358-.19-.105 3.674-7.98 3.93-7.98.254 0 4.292 3.17 5.42 9.875 1.125 6.704 1.343 9.874 1.125 10.02zm4.547-1.713c-.218.182-.618.437-.618.292 0-.146.29-1.86.18-1.895-.108-.035-.763.11-.8.256-.035.146.074 1.822-.072 1.895-.146.074-.618.402-.618.147s.327-2.37.182-2.442c-.146-.073-.982-.146-.982.11 0 .254-.036 2.696-.036 2.696s-.728.33-.728.22c0-.11-.182-7.69-1.928-12.062s-3.02-6.924-5.42-8.6c-.24-.167 2.328-5.977 2.583-6.013.256-.036 3.42 1.822 4.44 2.77 1.018.947 3.31 4.628 3.82 10.058.506 5.428.215 12.39-.003 12.57zm7.93-8.892s1.49 3.17 1.746 4.01c.255.837.182 1.092.073 1.202-.11.11-.8.364-.8.182s.255-1.895.036-2.004c-.218-.11-.837.036-.837.255 0 .22-.218 2.26-.218 2.26s-.69.327-.69.072.654-5.686.69-5.978zm-1.31 4.118c-.145 1.93-.072 2.26-.29 2.332-.218.073-.982.437-.982.255s.436-2.442.364-2.55c-.074-.11-.947-.037-.947.18s-.182 2.48-.327 2.734c-.146.256-1.09.365-1.09.365s.436-2.442.254-2.55c-.182-.11-.91-.147-.91.072 0 .22-.363 3.025-.363 3.025s-1.346.692-1.382.583c-.036-.11.837-3.462.327-8.71-.51-5.248-1.346-9.183-1.82-10.532-.035-.103 3.784 3.498 5.058 5.21 1.273 1.714 2.037 3.317 2.037 3.317s.216 4.34.07 6.27zm18.08-15.89c-.326-.218-1.78-.29-5.856.766-4.073 1.057-7.176 3.272-7.31 3.462-.183.255-.11.692.363.583.473-.108 1.018-.436 4.947-2.222 3.93-1.786 7.712-1.567 8.003-1.603.29-.036.182-.765-.145-.984zM22.08 23.2c-.29 0-1.596 2.906-1.746 3.207-.073.146.69.692.946.656.255-.036.946-2.114 1.164-2.114s1.637 1.202 1.855 1.238c.217.036.472-.255.545-.765.073-.51-2.474-2.223-2.765-2.223z" />
                </svg>

                <span className="font-medium">{certificate.year}</span>
              </div>

              <div className="card-actions">
                <Link
                  to={`/${certificate.id}/edit`}
                  className="btn btn-accent btn-sm"
                >
                  Edit
                </Link>

                <Form onSubmit={handleDeleteSubmit}>
                  <input type="hidden" name="id" value={certificate.id} />

                  <button className="btn btn-sm btn-ghost">Delete</button>
                </Form>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="btn-group justify-center mt-4">
        {pager.skip > 0 && (
          <Link
            to={`/?sort=${sort}&skip=${pager.skip - pager.take}&take=${
              pager.take
            }`}
            className="btn"
          >
            Previous
          </Link>
        )}

        {pager.skip + pager.take < pager.total && (
          <Link
            to={`/?sort=${sort}&skip=${pager.skip + pager.take}&take=${
              pager.take
            }`}
            className="btn"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
};

export default IndexRoute;
