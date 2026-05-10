import { ActivityCategory } from "@prisma/client";
import { Archive, Plus } from "lucide-react";
import { upsertActivityAction, upsertCityAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CatalogPage() {
  await requireAdmin();
  const [cities, activities] = await Promise.all([
    prisma.city.findMany({ orderBy: [{ isArchived: "asc" }, { popularity: "desc" }] }),
    prisma.activity.findMany({ orderBy: [{ isArchived: "asc" }, { name: "asc" }], include: { city: true }, take: 40 })
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <p className="label">Admin catalog</p>
        <h1 className="text-4xl font-black text-ink">Curated places and activities</h1>
      </div>

      <section className="grid gap-5 xl:grid-cols-2">
        <form action={upsertCityAction} className="sketch-panel doodle-map grid gap-4 p-5">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-coral" />
            <h2 className="text-2xl font-black">Add city</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" name="name" placeholder="City" required />
            <input className="input" name="country" placeholder="Country" required />
            <input className="input" name="region" placeholder="Region" required />
            <input className="input" name="imageUrl" placeholder="Image URL" required />
            <input className="input" name="costIndex" type="number" min="1" max="5" placeholder="Cost index" />
            <input className="input" name="popularity" type="number" min="1" max="100" placeholder="Popularity" />
          </div>
          <textarea className="input min-h-24" name="summary" placeholder="Short city summary" required />
          <label className="inline-flex items-center gap-2 text-sm font-black">
            <input name="isFeatured" type="checkbox" />
            Featured
          </label>
          <button className="btn-primary" type="submit">
            Save city
          </button>
        </form>

        <form action={upsertActivityAction} className="sketch-panel doodle-map grid gap-4 p-5">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-coral" />
            <h2 className="text-2xl font-black">Add activity</h2>
          </div>
          <select className="input" name="cityId" required>
            <option value="">Choose city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}, {city.country}
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" name="name" placeholder="Activity name" required />
            <select className="input" name="category">
              {Object.values(ActivityCategory).map((category) => (
                <option key={category} value={category}>{category.toLowerCase()}</option>
              ))}
            </select>
            <input className="input" name="durationHours" type="number" min="1" placeholder="Duration hours" />
            <input className="input" name="estimatedCost" type="number" min="0" placeholder="Estimated cost" />
            <input className="input" name="imageUrl" placeholder="Image URL" />
            <input className="input" name="tags" placeholder="food, slow, museum" />
          </div>
          <textarea className="input min-h-24" name="description" placeholder="Activity description" required />
          <label className="inline-flex items-center gap-2 text-sm font-black">
            <input name="isFeatured" type="checkbox" />
            Featured
          </label>
          <button className="btn-primary" type="submit">
            Save activity
          </button>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="sketch-panel grid gap-3 p-5">
          <h2 className="text-2xl font-black">Cities</h2>
          {cities.map((city) => (
            <form key={city.id} action={upsertCityAction} className="grid gap-3 border-b-2 border-ink/10 pb-4">
              <input name="cityId" type="hidden" value={city.id} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="input" name="name" defaultValue={city.name} />
                <input className="input" name="country" defaultValue={city.country} />
                <input className="input" name="region" defaultValue={city.region} />
                <input className="input" name="imageUrl" defaultValue={city.imageUrl} />
                <input className="input" name="costIndex" type="number" defaultValue={city.costIndex} />
                <input className="input" name="popularity" type="number" defaultValue={city.popularity} />
              </div>
              <textarea className="input min-h-20" name="summary" defaultValue={city.summary} />
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm font-black"><input name="isFeatured" type="checkbox" defaultChecked={city.isFeatured} /> Featured</label>
                <label className="inline-flex items-center gap-2 text-sm font-black"><input name="isArchived" type="checkbox" defaultChecked={city.isArchived} /> Archived</label>
              </div>
              <button className="btn-secondary justify-self-start" type="submit">Update city</button>
            </form>
          ))}
        </div>
        <div className="sketch-panel grid gap-3 p-5">
          <h2 className="text-2xl font-black">Activities</h2>
          {activities.map((activity) => (
            <form key={activity.id} action={upsertActivityAction} className="grid gap-3 border-b-2 border-ink/10 pb-4">
              <input name="activityId" type="hidden" value={activity.id} />
              <select className="input" name="cityId" defaultValue={activity.cityId}>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}, {city.country}</option>
                ))}
              </select>
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="input" name="name" defaultValue={activity.name} />
                <select className="input" name="category" defaultValue={activity.category}>
                  {Object.values(ActivityCategory).map((category) => (
                    <option key={category} value={category}>{category.toLowerCase()}</option>
                  ))}
                </select>
                <input className="input" name="durationHours" type="number" defaultValue={activity.durationHours} />
                <input className="input" name="estimatedCost" type="number" defaultValue={activity.estimatedCost} />
                <input className="input" name="imageUrl" defaultValue={activity.imageUrl} />
                <input className="input" name="tags" defaultValue={activity.tags.join(", ")} />
              </div>
              <textarea className="input min-h-20" name="description" defaultValue={activity.description} />
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm font-black"><input name="isFeatured" type="checkbox" defaultChecked={activity.isFeatured} /> Featured</label>
                <label className="inline-flex items-center gap-2 text-sm font-black"><input name="isArchived" type="checkbox" defaultChecked={activity.isArchived} /> Archived</label>
              </div>
              <button className="btn-secondary justify-self-start" type="submit">
                <Archive className="h-4 w-4" />
                Update activity
              </button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
